/* 
* CCaaS Public Chat Channel Connector
* (C) 2022, Tomohiro Iwasa, tiwasa@avaya.com
* This code is licensed under the MIT License
*/

"use strict";

import { _stdout, _stdout_log, _stdout_table, _stderror } from "./lib/stdout.js";
const INFO = true;
const DEBUG = true;

import ChatConnector from "./chatconnector.js";

export default class ChatContact extends ChatConnector {
	constructor(channel) {
		super(channel);
		this.channel = channel;
		this.account = [];
		this.account_template = {
			id: "",
			customerIdentifier: "",
			displayName: "",
			firstName: "",
			lastName: "",
			emailAddress: "",
			contactNumber: "",
			sessionParameters: null,
			session: null,
			engagement: null,
			message: null,
		};
		this.account_message_template = {
			providerDialogId: "",
			providerSenderId: null,
			senderName: "",
			senderType: "CUSTOMER",
			providerMessageId: null,
			parentMessageId: null,
			body: {},
		};
		this.statistics = {};
		this.log = []
	}

	getNumberOfAccountsRegistered() {
		return this.account.length;
	}

	getAccountByCustomerIdentifier(customerIdentifier) {
		return new Promise(async (resolve) => {
			this.account.forEach((item, i) => {
				if (item.customerIdentifier === customerIdentifier) {
					if (DEBUG) _stdout(`getAccountByCustomerIdentifier ${customerIdentifier} ${i} ${JSON.stringify(item)}`);
					resolve(i);
					return;
				}
			});
			resolve(-1);
		});
	}

	addAccount(profile) {
		return new Promise(async (resolve) => {
			if (INFO) _stdout(`addAccount ${JSON.stringify(profile)}`);
			await this.getAccountByCustomerIdentifier(profile.customerIdentifier).then((n) => {
				if (n === -1) {
					this.account.push(this.account_template);
					n = this.account.length - 1;
				}
				this.account[n].id = this.channel.id;
				this.account[n].customerIdentifier = profile.customerIdentifier;
				this.account[n].displayName = profile.displayName;
				this.account[n].firstName = profile.firstName;
				this.account[n].lastName = profile.lastName;
				this.account[n].emailAddress = profile.emailAddress;
				this.account[n].contactNumber = profile.contactNumber;
				if (INFO | DEBUG) _stdout(`addAccount success ${n}`);
				resolve(n);
			});
		});
	}

	removeAccount(customerIdentifier) {
		if (INFO) _stdout(`removeAccount customerIdentifier:${customerIdentifier}`);
		this.account = this.account.filter((item) => item.customerIdentifier !== customerIdentifier);
	}
	
	removeAllAccounts() {
		this.account = [];
		if (INFO) _stdout(`removeAllAccounts done`);
	}

	async aquireAgent(profile, attributes) {
		let n = await this.addAccount(profile);
		if (INFO) _stdout(`aquireAgent ${JSON.stringify(profile)} ${JSON.stringify(attributes)}`);
		this.account[n].sessionParameters = attributes;
		return await this.createSession(this.account[n]).then(async (session) => {
			if (!session) {
				if (INFO | DEBUG) _stdout(`Session failue to establish`);
				return false;
			}
			if (session.sessionStatus !== "ACTIVE") {
				if (INFO | DEBUG) _stdout(`aquireAgent session failue to create - sessionStatus:${session.sessionStatus}`);
				return false;
			}
			this.account[n].session = session;
			return await this.createEngagement(this.account[n]).then((engagement) => {
				this.account[n].engagement = engagement;
				return true;
			}).catch((error) => {
				if (INFO | DEBUG) _stdout(`aquireAgent createEngagement failue ${JSON.stringify(error)}`);
				return false;
			});
		}).catch((error) => {
			if (INFO | DEBUG) _stdout(`aquireAgent createSession failue ${JSON.stringify(error)}`);
			return false;
		});
	}

	async getMesssages(customerIdentifier) {
		if (INFO) _stdout(`getMesssages customerIdentifier:${customerIdentifier}`);
	}

	async receiveMesssage(customerIdentifier) {
		if (INFO) _stdout(`receiveMesssage customerIdentifier:${customerIdentifier}`);
	}

	async sendMessageToAgent(customerIdentifier, text) {
		let n = await this.getAccountByCustomerIdentifier(customerIdentifier);
		if (n === -1) {
			if (INFO | DEBUG) _stdout(`sendMessageToAgent customerIdentifier not valid ${customerIdentifier}`);
			return false;
		}
		if (INFO) _stdout(`sendMessageToAgent ${customerIdentifier} ${text}`);
		this.account[n].message = JSON.parse(JSON.stringify(this.account_message_template));
		this.account[n].message.body = {
			elementType: "text",
			elementText: {
				text: text,
				textFormat: "PLAINTEXT",
			},
			payload: null,
		};
		await this.sendMessage(this.account[n]);
		return true;
	}

	async receiveMessageFromAgent(customerIdentifier) {
		if (INFO) _stdout(`receiveMessageFromAgent customerIdentifier:${customerIdentifier}`);
	}

	async releaseAgent(customerIdentifier) {
		let n = await this.getAccountByCustomerIdentifier(customerIdentifier);
		if (n === -1) {
			if (INFO | DEBUG) _stdout(`releaseAgent customerIdentifier not valid ${customerIdentifier}`);
			return false;
		}
		if (INFO) _stdout(`releaseAgent customerIdentifier:${customerIdentifier}`);
		this.result = null;
		return await this.disconnectEngagement(this.account[n]).then(async (result) => {
			this.result = result; // supposed to be null returned
			this.account[n].engagement = null;
			return await this.terminateSession(this.account[n]).then((result) => {
				this.result = result; // supposed to be null returned
				this.account[n].session = null;
				if (INFO | DEBUG) _stdout(`releaseAgent Engagement/Session disconnected/terminated`);
				return true;
			}).catch((error) => {
				if (INFO | DEBUG) _stdout(`releaseAgent terminateSession failue ${JSON.stringify(error)}`);
				return false;
			});
		}).catch((error) => {
			if (INFO | DEBUG) _stdout(`releaseAgent disconnectEngagement failue ${JSON.stringify(error)}`);
			return false;
		});
	}
}
