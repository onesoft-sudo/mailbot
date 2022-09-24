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

import { ChatInputCommandInteraction, CommandInteraction, Embed, EmbedBuilder, Message, User } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/Client';
import CommandOptions from '../../types/CommandOptions';
import Thread from '../../models/Thread';
import { getChannel, getGuild, loggingChannel, stringToDate } from '../../utils/utils';
import split from 'split-string';
import { setTimeout } from 'timers/promises';

export interface ThreadCloseOptions {
    del?: boolean;
    dm?: boolean;
    reason?: string | null;
    closeAfter?: number;
}

export async function closeThread(client: DiscordClient, channel: string, closedBy: User, { del = false, dm = true, reason = null }: ThreadCloseOptions) {
    const thread = await Thread.findOne({ channel });

    if (!thread) {
        return null;
    }

    await thread.delete();

    if (del) {
        try {
            await (await getChannel(client, channel))?.delete(reason ?? undefined);
        }
        catch (e) {
            console.log(e);
        }
    }

    let user = null;

    try {
        user = await client.users.fetch(thread.user);
    }
    catch (e) {
        console.log(e);
    }

    console.log(reason ?? '*No reason provided*');

    await (loggingChannel(client).send({
        embeds: [
            new EmbedBuilder({
                author: user ? {
                    name: user.tag,
                    iconURL: user.displayAvatarURL()
                } : undefined,
                title: 'Thread closed',
                fields: [
                    {
                        name: 'User ID',
                        value: thread.user
                    },
                    {
                        name: 'Thread ID',
                        value: thread.id
                    },
                    {
                        name: 'Channel ID',
                        value: thread.channel
                    },
                    {
                        name: 'Closed By',
                        value: closedBy.tag + ` (${closedBy.id})`
                    },
                    {
                        name: 'Reason',
                        value: `${reason ?? '*No reason provided*'}`
                    },
                ],
                footer: {
                    text: `Closed`
                },
                color: 0xf14a60
            })
            .setTimestamp()
        ]
    }));

    try {
        if (dm && user) {
            const member = await getGuild(client)?.members.fetch(user.id);

            if (member) {
                await member.send({
                    embeds: [
                        new EmbedBuilder({
                            author: {
                                name: 'Thread Closed',
                                iconURL: client.user?.displayAvatarURL()
                            },
                            color: 0xf14a60,
                            description: 'Thanks for contacting us using MailBot! If you have any further questions or issues, feel free to DM again!',
                            fields: reason ? [
                                {
                                    name: 'Reason',
                                    value: reason
                                }
                            ] : [],
                            footer: {
                                text: 'Closed',
                                iconURL: getGuild(client)!.iconURL() ?? undefined
                            }
                        })
                        .setTimestamp()
                    ]
                });
            }
        }
    }
    catch (e) {
        console.log(e);
    }

    return thread;
}

export default class CloseCommand extends BaseCommand {
    mailOnly = true;
    requireModRole = true;

    constructor() {
        super('close', 'mailing', ['ct', 'c']);
    }

    async run(client: DiscordClient, message: Message | CommandInteraction, options?: CommandOptions) {
        let reason: string | null = null;
        let closeAfter: string | null = null;
        let dm: boolean = true;

        if (message instanceof CommandInteraction && message.isChatInputCommand()) {
            reason = message.options.getString('reason');
            closeAfter = message.options.getString('close_in');
            await message.deferReply();
        }
        else if (options) {
            closeAfter = options.rawArgs.filter(a => a[0] !== '-d' && a[0] !== '--delete').join(' ').trim();
            console.log(closeAfter);
            closeAfter = closeAfter === '' ? null : closeAfter;
        }

        if (closeAfter) {
            const splitted = split(closeAfter, {
                brackets: true,
                separator: ' ',
                quotes: ['"', "'"],
            });

            dm = !splitted.includes('silently') || !splitted.includes('silent');

            const seconds = stringToDate(closeAfter);
            const msg = message instanceof ChatInputCommandInteraction ? await message.fetchReply() : message;

            if (seconds) {
                setTimeout(seconds * 1000).then(async () => {
                    const thread = await closeThread(client, message.channel!.id, message.member!.user as User, {
                        del:  options?.options['-d'] !== undefined || options?.options['--delete'] !== undefined || ((message instanceof ChatInputCommandInteraction && message.options.getBoolean('delete')) ?? false),
                        dm,
                        reason
                    });

                    if (!thread) {
                        await msg.reply({
                            embeds: [
                                {
                                    description: ':x: This thread is already closed.',
                                    color: 0xf14a60
                                }
                            ]
                        });
            
                        return;
                    }

                    try {
                        await msg.reply({
                            embeds: [
                                new EmbedBuilder({
                                    description: 'The thread has been closed.',
                                    color: 0x007bff,
                                    fields: reason ? [
                                        {
                                            name: 'Reason',
                                            value: reason
                                        }
                                    ] : [],
                                    footer: {
                                        text: thread.id + ''
                                    }
                                })
                                .setTimestamp()
                            ]
                        });
                    }
                    catch (e) {
                        console.log(e);
                    }
                }).catch(console.log);

                await this.deferedReply(message, {
                    embeds: [
                        new EmbedBuilder({
                            description: 'The thread will be closed at ' + (new Date(Date.now() + seconds).toLocaleString()) + '.',
                            color: 0x007bff,
                            fields: reason ? [
                                {
                                    name: 'Reason',
                                    value: reason
                                }
                            ] : [],
                            footer: {
                                text: 'Queued'
                            }
                        })
                        .setTimestamp()
                    ]
                });

                return;
            }
        }

        const thread = await closeThread(client, message.channel!.id, message.member!.user as User, {
            del:  options?.options['-d'] !== undefined || options?.options['--delete'] !== undefined || ((message instanceof ChatInputCommandInteraction && message.options.getBoolean('delete')) ?? false),
            dm,
            reason
        });

        if (!thread) {
            await this.deferedReply(message, {
                embeds: [
                    {
                        description: ':x: This thread is already closed.',
                        color: 0xf14a60
                    }
                ]
            });

            return;
        }

        try {
            await this.deferedReply(message, {
                embeds: [
                    new EmbedBuilder({
                        description: 'The thread has been closed.\n*MailBot will not delete the thread channel unless you specify the `-d` flag so that you won\'t lose the conversation. To delete the thread channel, run `' + client.config.prefix + 'delete`.*',
                        color: 0x007bff,
                        fields: reason ? [
                            {
                                name: 'Reason',
                                value: reason
                            }
                        ] : [],
                        footer: {
                            text: thread.id + ''
                        }
                    })
                    .setTimestamp()
                ]
            });
        }
        catch (e) {
            console.log(e);
        }
    }
}