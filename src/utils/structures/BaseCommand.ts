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

import { CommandInteraction, Guild, GuildChannel, GuildMember, InteractionDeferUpdateOptions, InteractionReplyOptions, Message, MessageReplyOptions, MessagePayload, PermissionsBitField, Role, RoleResolvable } from 'discord.js';
import DiscordClient from '../../client/Client';
import CommandOptions from '../../types/CommandOptions';

export default abstract class BaseCommand {
    public readonly mailOnly: boolean = false;
    public readonly roles: RoleResolvable[] = [];
    public readonly requireModRole: boolean = true;
    public readonly permissions: PermissionsBitField | null = null;

    constructor(private name: string, private category: string, private aliases: Array<string>) {
        
    }

    getName(): string {
        return this.name;
    }

    getCategory(): string {
        return this.category;
    }

    getAliases(): Array<string> {
        return this.aliases;
    }

    getAllNames(): string[] {
        return [this.getName(), ...this.getAliases()];
    }

    async deferedReply(msg: Message | CommandInteraction, options: string | MessageReplyOptions | MessagePayload | InteractionReplyOptions) {
        if (msg instanceof Message) 
            await msg.reply(options as MessageReplyOptions);
        else {
            if (msg.deferred) {
                await msg.editReply(options as (MessagePayload | string));
            }
            else {
                await msg.reply(options as (MessagePayload | string));
            }
        }
    }

    public async execute(client: DiscordClient, message: Message | CommandInteraction, options?: CommandOptions) {
        if (this.roles.length > 0 || this.requireModRole) {
            let member: GuildMember;

            if (message instanceof Message) {
                member = message.member!;
            }
            else {
                member = await message.guild!.members.fetch(message.member!.user.id);
            }

            for await (const role of [...this.roles, client.config.role]) {
                if (!member.roles.cache.has(role instanceof Role ? role.id : role)) {
                    await message.reply({
                        embeds: [
                            {
                                description: ':x: You don\'t have permission to run this command.',
                                color: 0xf14a60
                            }
                        ]
                    });
    
                    return;
                }
            }
        }

        if (this.permissions) {
            if ((message instanceof CommandInteraction && !message.memberPermissions?.has(this.permissions)) || (message instanceof Message && !message.member?.permissions.has(this.permissions))) {
                await message.reply({
                    embeds: [
                        {
                            description: ':x: You don\'t have enough permissions to run this command.',
                            color: 0xf14a60
                        }
                    ]
                });

                return;
            }
        }

        if (this.mailOnly) {
            const { mail_category } = client.config;

            if ((message.channel! as GuildChannel).parent?.id !== mail_category) {
                await message.reply({
                    embeds: [
                        {
                            description: ':x: You can only run this command inside a mail thread.',
                            color: 0xf14a60
                        }
                    ]
                });

                return;
            }
        }

        return await this.run(client, message, options);
    }

    abstract run(client: DiscordClient, message: Message | CommandInteraction, options?: CommandOptions): Promise<void>;
}