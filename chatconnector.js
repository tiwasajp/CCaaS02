/* 
* CCaaS Public Chat Channel Connector
* (C) 2022, Tomohiro Iwasa, tiwasa@avaya.com
* This code is licensed under the MIT License
*/

"use strict";

import restAPI from "./lib/restAPI.js";
const RESTAPI_TIMEOUT = 5000;

import { _stdout, _stdout_log, _stdout_table, _stderror } from "./lib/stdout.js";
const INFO = true;
const DEBUG = true;

export default class ChatConnector {
	constructor(channel) {
		this.chat_channel = channel;
		this.chat_channel.URL = {
			access_token: "https://SERVER/auth/realms/ACCOUNT_ID/protocol/openid-connect/token",
			create_session: "https://SERVER/api/digital/v1/sessions",
			create_engagement: "https://SERVER/api/digital/v1/engagements",
			send_message: "https://SERVER/api/digital/v1/engagements/ENGAGEMENT_ID/messages",
			get_message: "https://SERVER/api/digital/v1/engagements/ENGAGEMENT_ID/messages?dialogId=DIALOG_ID&sessionId=SESSION_ID",
			disconnect_emgagement: "https://SERVER/api/digital/v1/engagements/ENGAGEMENT_ID:disconnect",
			terminate_session: "https://SERVER/api/digital/v1/sessions/SESSION_ID:terminate",
		};
		this.chat_channel.token = null;
	}

	getToken() {
		return new Promise(async (resolve, reject) => {
			if (this.chat_channel.token && ((new Date()).getTime() - (new Date(this.chat_channel.token.got_at)).getTime()) / 1000 < this.chat_channel.token.expires_in) {
				//let elapsed_time = Math.round(((new Date()).getTime() - (new Date(this.chat_channel.token.got_at)).getTime()) / 1000);
				//if (DEBUG) _stdout(`getToken valid token found elapsed_time:${elapsed_time}s expires_in:${this.chat_channel.token.expires_in}s`);
				resolve(true);
			}
			else {
				try {
					await restAPI(
						this.chat_channel.URL.access_token.replace("SERVER", this.chat_channel.server).replace("ACCOUNT_ID", this.chat_channel.id),
						{
							method: "POST",
							headers: {
								"Content-Type": "application/x-www-form-urlencoded",
								"Authorization": `Basic ${(new Buffer.from(this.chat_channel.auth).toString("base64"))}`,
							},
							json: false,
							body: {
								grant_type: "client_credentials",
								scope: "email profile",
							},
							timeout: RESTAPI_TIMEOUT,
						}
					).then((token) => {
						if (!token) {
							if (INFO | DEBUG) _stdout(`getToken failed token:null}`);
							reject({ error: "getToken failed" });
							return;
						}
						this.chat_channel.token = token;
						this.chat_channel.token.got_at = new Date();
						//if (DEBUG) _stdout(`getToken access_token:${this.chat_channel.token.access_token} got_at:${this.chat_channel.token.got_at}`);
						if (DEBUG) _stdout(`getToken access_token got_at:${this.chat_channel.token.got_at}`);
						resolve(token);
					}).catch((error) => {
						if (INFO | DEBUG) _stdout(`getToken ${JSON.stringify(error)}`);
						reject({ error: error });
					});
				}
				catch (error) {
					if (INFO | DEBUG) _stdout(`getToken ${JSON.stringify(error)}`);
					reject({ error: error });
				}
			}
		});
	}

	createSession(account) {
		return new Promise(async (resolve, reject) => {
			if (DEBUG) _stdout(`createSession REQ ${JSON.stringify(account)}`);
			try {
				this.getToken().then(async (result) => {
					if (!result) {
						if (INFO | DEBUG) _stdout(`createSession error getToken failed.`);
						reject({ error: "getToken failed" });
					}
					else {
						await restAPI(
							this.chat_channel.URL.create_session.replace("SERVER", this.chat_channel.server),
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									"Authorization": `Bearer ${this.chat_channel.token.access_token}`,
								},
								json: true,
								body: {
									accountId: account.id,
									customerIdentifier: account.customerIdentifier,
									displayName: account.displayName,
									firstName: account.firstName,
									lastName: account.lastName,
									emailAddress: account.emailAddress,
									contactNumber: account.contactNumber,
									sessionParameters: account.sessionParameters,
								},
								timeout: RESTAPI_TIMEOUT,
							}
						).then((session) => {
							if (DEBUG) _stdout(`createSession RESP ${JSON.stringify(session)}`);
							resolve(session);
						}).catch((error) => {
							if (INFO | DEBUG) _stdout(`createSession ${JSON.stringify(error)}`);
							reject({ error: error });
						});
					}
				}).catch((error) => {
					if (INFO | DEBUG) _stdout(`createSession ${JSON.stringify(error)}`);
					reject({ error: error });
				});
			}
			catch (error) {
				if (INFO | DEBUG) _stdout(`createSession ${JSON.stringify(error)}`);
				reject({ error: error });
			}
		});
	}

	createEngagement(account) {
		return new Promise(async (resolve, reject) => {
			if (DEBUG) _stdout(`createEngagement REQ ${JSON.stringify(account)}`);
			try {
				this.getToken().then(async (result) => {
					if (!result) {
						if (INFO | DEBUG) _stdout(`createSession error getToken failed.`);
						reject({ error: "getToken failed" });
					} else {
						await restAPI(
							this.chat_channel.URL.create_engagement.replace("SERVER", this.chat_channel.server),
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									"Authorization": `Bearer ${this.chat_channel.token.access_token}`,
								},
								json: true,
								body: {
									sessionId: account.session.sessionId,
									accountId: account.session.accountId,
									customerIdentifier: account.session.customerIdentifier,
									conversation: account.session.conversation,
									channelProviderId: account.session.channelProviderId,
									mediaType: account.session.mediaType,
									contextParameters: account.session.contextParameters,
								},
								timeout: RESTAPI_TIMEOUT,
							}
						).then((engagement) => {
							if (DEBUG) _stdout(`createEngagement RESP ${JSON.stringify(engagement)}`);
							resolve(engagement);
						}).catch((error) => {
							if (INFO | DEBUG) _stdout(`createEngagement ${JSON.stringify(error)}`);
							reject({ error: error });
						});
					}
				}).catch((error) => {
					if (INFO | DEBUG) _stdout(`createEngagement ${JSON.stringify(error)}`);
					reject({ error: error });
				});
			}
			catch (error) {
				if (INFO | DEBUG) _stdout(`createEngagement ${JSON.stringify(error)}`);
				reject({ error: error });
			}
		});
	}

	sendMessage(account) {
		return new Promise(async (resolve, reject) => {
			if (DEBUG) _stdout(`sendMessage REQ ${JSON.stringify(account)}`);
			try {
				this.getToken().then(async (result) => {
					if (!result) {
						if (INFO | DEBUG) _stdout(`sendMessage error getToken failed.`);
						reject({ error: "getToken failed" });
					}
					else {
						await restAPI(
							this.chat_channel.URL.send_message.replace("SERVER", this.chat_channel.server).replace("ENGAGEMENT_ID", account.engagement.engagementId),
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									"Authorization": `Bearer ${this.chat_channel.token.access_token}`,
								},
								json: true,
								body: {
									sessionId: account.engagement.sessionId,
									dialogId: account.engagement.dialogId,
									correlationId: account.engagement.correlationId,
									providerDialogId: account.message.providerDialogId,
									providerSenderId: account.message.providerSenderId,
									senderName: account.message.senderName,
									senderType: account.message.senderType,
									providerMessageId: account.message.providerMessageId,
									parentMessageId: account.message.parentMessageId,
									body: account.message.body,
								},
								timeout: RESTAPI_TIMEOUT,
							}
						).then((result) => {
							if (DEBUG) _stdout(`sendMessage RESP ${account.engagement.engagementId} ${JSON.stringify(account.message.body)} ${JSON.stringify(result)}`);
							resolve(result);

						}).catch((error) => {
							if (INFO | DEBUG) _stdout(`sendMessage ${JSON.stringify(error)}`);
							reject({ error: error });
						});
					}
				}).catch((error) => {
					if (INFO | DEBUG) _stdout(`sendMessage ${JSON.stringify(error)}`);
					reject({ error: error });
				});
			}
			catch (error) {
				if (INFO | DEBUG) _stdout(`sendMessage ${JSON.stringify(error)}`);
				reject({ error: error });
			}
		});
	}

	getMessages(account) {
		return new Promise(async (resolve, reject) => {
			if (DEBUG) _stdout(`getMessages REQ ${JSON.stringify(account)}`);
			try {
				this.getToken().then(async (result) => {
					if (!result) {
						if (INFO | DEBUG) _stdout(`getMessages error getToken failed.`);
						reject({ error: "getToken failed" });
					}
					else {
						await restAPI(
							this.chat_channel.URL.get_message.replace("SERVER", this.chat_channel.server).replace("ENGAGEMENT_ID", account.engagement.engagementId).replace("DIALOG_ID", account.engagement.dialogId).replace("SESSION_ID", account.engagement.sessionId),
							{
								method: "GET",
								headers: {
									"Content-Type": "application/json",
									"Authorization": `Bearer ${this.chat_channel.token.access_token}`,
								},
								json: true,
							}
						).then((data) => {
							if (INFO | DEBUG) _stdout(`getMessages:`);
							data.forEach((d) => {
								if (DEBUG) _stdout_log(d.body.elementText);
							});
							resolve(data);
						}).catch((error) => {
							if (INFO | DEBUG) _stdout(`getMessages ${JSON.stringify(error)}`);
							reject({ error: error });
						});
					}
				}).catch((error) => {
					if (INFO | DEBUG) _stdout(`getMessages ${JSON.stringify(error)}`);
					reject({ error: error });
				});
			}
			catch (error) {
				if (INFO | DEBUG) _stdout(`getMessages ${JSON.stringify(error)}`);
				reject({ error: error });
			}
		});
	}

	disconnectEngagement(account) {
		return new Promise(async (resolve, reject) => {
			if (DEBUG) _stdout(`disconnectEngagement REQ ${JSON.stringify(account)}`);
			try {
				this.getToken().then(async (result) => {
					if (!result) {
						if (INFO | DEBUG) _stdout(`disconnectEngagement error getToken failed.`);
						reject({ error: "getToken failed" });
					}
					else {
						await restAPI(
							this.chat_channel.URL.disconnect_emgagement.replace("SERVER", this.chat_channel.server).replace("ENGAGEMENT_ID", account.engagement.engagementId),
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									"Authorization": `Bearer ${this.chat_channel.token.access_token}`,
								},
								json: true,
								body: {
									sessionId: account.engagement.sessionId,
									dialogId: account.engagement.dialogId,
									participantId: "",
									reason: "USER_CLOSED",
								},
								timeout: RESTAPI_TIMEOUT,
							}
						).then((result) => {
							if (DEBUG) _stdout(`disconnectEngagement RESP ${account.engagement.engagementId}`);
							resolve(result);
						}).catch((error) => {
							if (INFO | DEBUG) _stdout(`disconnectEngagement ${JSON.stringify(error)}`);
							reject({ error: error });
						});
					}
				}).catch((error) => {
					if (INFO | DEBUG) _stdout(`disconnectEngagement ${JSON.stringify(error)}`);
					reject({ error: error });
				});
			}
			catch (error) {
				if (INFO | DEBUG) _stdout(`disconnectEngagement ${JSON.stringify(error)}`);
				reject({ error: error });
			}
		});
	}

	terminateSession(account) {
		return new Promise(async (resolve, reject) => {
			if (DEBUG) _stdout(`terminateSession REQ ${JSON.stringify(account)}`);
			try {
				this.getToken().then(async (result) => {
					if (!result) {
						if (INFO | DEBUG) _stdout(`terminateSession error getToken failed.`);
						reject({ error: "getToken failed" });
					}
					else {
						await restAPI(
							this.chat_channel.URL.terminate_session.replace("SERVER", this.chat_channel.server).replace("SESSION_ID", account.session.sessionId),
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									"Authorization": `Bearer ${this.chat_channel.token.access_token}`,
								},
								json: true,
								body: {
									reason: "USER_CLOSED",
								},
								timeout: RESTAPI_TIMEOUT,
							}
						).then((result) => {
							if (INFO | DEBUG) _stdout(`terminateSession RESP ${account.session.sessionId}`);
							resolve(result);
						}).catch((error) => {
							if (INFO | DEBUG) _stdout(`terminateSession ${JSON.stringify(error)}`);
							reject({ error: error });
						});
					}
				}).catch((error) => {
					if (INFO | DEBUG) _stdout(`terminateSession ${JSON.stringify(error)}`);
					reject({ error: error });
				});
			}
			catch (error) {
				if (INFO | DEBUG) _stdout(`terminateSession ${JSON.stringify(error)}`);
				reject({ error: error });
			}
		});
	}
}



