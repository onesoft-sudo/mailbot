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

import { formatDistanceToNowStrict } from "date-fns";
import { Message, CommandInteraction, CacheType, GuildMember, User, EmbedBuilder, ChatInputCommandInteraction, escapeMarkdown } from "discord.js";
import Client from "../../client/Client";
import BlockedUser from "../../models/BlockedUser";
import CommandOptions from "../../types/CommandOptions";
import BaseCommand from "../../utils/structures/BaseCommand";
import { getGuild, getUser, loggingChannel } from "../../utils/utils";

export default class BlockCommand extends BaseCommand {
    constructor() {
        super('block', 'mailing', ['blk']);
    }

    async run(client: Client, message: Message<boolean> | ChatInputCommandInteraction<CacheType>, options?: CommandOptions | undefined): Promise<void> {
        if (options && options.args[0] === undefined) {
            await message.reply({
                embeds: [
                    {
                        description: ':x: You must specify a user to block.',
                        color: 0xf14a60
                    }
                ]
            });

            return;
        }

        let member: GuildMember | undefined;
        let reason: string | undefined;
        const notify = message instanceof Message ? (options?.options["-n"] ?? options?.options["--notify"] ?? false) : (message.options.getBoolean('notify') ?? false);

        if (options) {
            member = await getUser(options.args[0]);
        }
        else if (message instanceof CommandInteraction) {
            member = message.options.getMember('user')! as GuildMember;
            reason = message.options.getString('reason') ?? undefined;
        }

        if (!member || member.user.bot) {
            await message.reply({
                embeds: [
                    {
                        description: ':x: Invalid member specified.' + (member?.user.bot ? ' You cannot do that with a Bot user.' : ''),
                        color: 0xf14a60
                    }
                ]
            });

            return;
        }

        const blockedUser = await BlockedUser.findOne({ discordID: member.id });

        if (blockedUser) {
            await message.reply({
                embeds: [
                    {
                        description: ':x: This user is already blocked! (Added to blocklist ' + formatDistanceToNowStrict(blockedUser.createdAt, { addSuffix: true }) + ')',
                        color: 0xf14a60
                    }
                ]
            });

            return;
        }

        await BlockedUser.create({
            createdAt: new Date(),
            discordID: member.id
        });

        await loggingChannel(client).send({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: member.user.tag,
                        iconURL: member.user.displayAvatarURL()
                    },
                    title: "User blocked",
                    fields: [
                        {
                            name: "User ID",
                            value: member.id,
                        },
                        {
                            name: "Blocked By",
                            value: `${(message.member?.user as User).tag} (${message.member?.user.id})`,
                        },
                        {
                            name: "Reason",
                            value: `${reason ? escapeMarkdown(reason) : "*No reason provided*"}`
                        }
                    ],
                    color: 0xf14a60,
                    footer: {
                        text: 'Blocked'
                    }
                })
                .setTimestamp()
            ]
        });

        if (notify) {
            try {
                await member.send({
                    embeds: [
                        new EmbedBuilder({
                            author: {
                                name: 'You have been blocked',
                                iconURL: client.user?.displayAvatarURL()
                            },
                            description: 'You have been restricted from using MailBot.',
                            fields: reason ? [
                                {
                                    name: "Reason",
                                    value: `${escapeMarkdown(reason)}`
                                }
                            ] : [],
                            footer: {
                                text: 'Blocked',
                                iconURL: getGuild(client)!.iconURL() ?? undefined
                            },
                            color: 0xf14a60
                        })
                        .setTimestamp()
                    ]
                });
            }
            catch (e) {
                console.log(e);
            }
        }

        await message.reply({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: member.user.tag,
                        icon_url: member.user.displayAvatarURL(),
                    },
                    description: 'This user was blocked. They will not be able to communicate with MailBot until you unblock them.',
                    fields: reason ? [
                        {
                            name: "Reason",
                            value: `${escapeMarkdown(reason)}`
                        }
                    ] : [],
                    footer: {
                        text: 'Blocked'
                    },
                    color: 0xf14a60
                })
                .setTimestamp()
            ]
        });
    }
}