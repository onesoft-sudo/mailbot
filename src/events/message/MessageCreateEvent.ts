/**
* This file is part of MailBot.
* 
* Copyright (C) 2021-2022 OSN Inc.
*
* MailBot is free software; you can redistribute it and/or modify it
* under the terms of the GNU Affero General Public License as published by 
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* 
* MailBot is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of 
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License 
* along with MailBot. If not, see <https://www.gnu.org/licenses/>.
*/

import BaseEvent from '../../utils/structures/BaseEvent';
import { ChannelType, Message } from 'discord.js';
import DiscordClient from '../../client/Client';

export default class MessageCreateEvent extends BaseEvent {
    constructor() {
        super('messageCreate');
    }

    async run(client: DiscordClient, message: Message) {
        if (message.author.bot) 
            return;

        if (message.channel.type === ChannelType.DM || !message.guild) {
            client.emit('dmCreate', message);
            return;
        }
        
        if (message.content.startsWith(client.config.prefix)) {
            const rawArgv = message.content
                .slice(client.prefix.length)
                .trim()
                .split(/ +/);
            const [cmdName, ...cmdArgs] = rawArgv;

            const command = client.commands.get(cmdName);
            
            if (command && command.legacy) {
                const options: { [key: string]: string } = {};
                const args: string[] = [];

                let i = 0;

                for await (let a of cmdArgs) {
                    if (!a.startsWith('-')) {
                        if (typeof options[a] === 'undefined') {
                            args.push(a);
                        }

                        i++;

                        continue;
                    }

                    options[a] = cmdArgs[i + 1] ?? true;
                    i++;
                }

                command.execute(client, message, {
                    rawArgv,
                    rawArgs: cmdArgs,
                    args,
                    options,
                });
            }
        }
    }
}