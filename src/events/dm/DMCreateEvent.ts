import { Attachment, AttachmentBuilder, EmbedBuilder, Message, TextChannel, User } from "discord.js";
import DiscordClient from "../../client/Client";
import Client from "../../client/Client";
import BlockedUser from "../../models/BlockedUser";
import Thread from "../../models/Thread";
import BaseEvent from "../../utils/structures/BaseEvent";
import { embed, formatSize, getChannel, getGuild, loggingChannel, mailCategory } from "../../utils/utils";

export async function createThread(client: DiscordClient, name: string | null, user: User, createdBy: User = user) {
    const parent = await mailCategory(client);

    if (!name) {
        name = user.tag.replace('#', '-');
    }

    const channel = await client.guilds.cache.get(process.env.GUILD_ID!)?.channels.create({
        name,
        parent,
    });

    const thread = await Thread.create({
        user: user.id,
        channel: channel!.id,
        createdBy: createdBy.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await channel?.send({
        embeds: [
            new EmbedBuilder({
                author: {
                    name: user.tag,
                    iconURL: user.displayAvatarURL(),
                },
                thumbnail: {
                    url: user.displayAvatarURL(),
                },
                description: `${createdBy} created a new thread conversation. You can reply to it below using \`r\` or \`a\` command.\nThe thread ID is \`${thread.id}\`.`,
                footer: {
                    text: `Created • ${user.id}`
                },
                color: 0x007bff
            })
            .setTimestamp()
        ]
    });

    loggingChannel(client).send(embed(new EmbedBuilder({
        author: {
            name: user.tag,
            iconURL: user.displayAvatarURL()
        },
        title: 'New Thread',
        description: 'A new thread was created. ' + channel!.toString(),
        fields: [
            {
                name: 'User ID',
                value: createdBy.id
            },
            {
                name: 'Thread ID',
                value: thread.id
            },
            {
                name: 'Channel ID',
                value: channel!.id
            }
        ],
        footer: {
            text: `Created`
        },
        color: 0x007bff
    }).setTimestamp()));

    return { channel, thread, createdBy, user };
}

export default class DMCreateEvent extends BaseEvent {
    constructor() {
        super('dmCreate');
    }

    async run(client: Client, message: Message) {
        const blockedUser = await BlockedUser.findOne({ discordID: message.author.id });

        if (blockedUser) {
            return;
        }

        let thread = await Thread.findOne({ user: message.author.id });
        let channel: TextChannel | undefined;
        
        if (!thread) {
            const { channel: newChannel, thread: newThread } = await createThread(client, message.author.tag.replace('#', '-'), message.author);
            thread = newThread!;
            channel = newChannel!;

            await message.reply({
                embeds: [
                    new EmbedBuilder({
                        author: {
                            name: 'Thread Created',
                            iconURL: client.user?.displayAvatarURL()
                        },
                        description: 'Thanks for using MailBot! One of the staff team members will get you in touch soon!\nIf you have any further messages to send, DM again!',
                        color: 0x007bff,
                        footer: {
                            text: 'Created',
                            iconURL: getGuild(client)!.iconURL() ?? undefined
                        }
                    })
                    .setTimestamp()
                ]
            });
        }
        else {
            channel = <TextChannel> await getChannel(client, thread.channel);
        }

        if (!channel) {
            return;
        }

        const media: EmbedBuilder[] = [];
        const files: Attachment[] = [];

        for await (let a of message.attachments.values()) {
            if (/^(image)\//.test(a.contentType ?? '')) {
                media.push(
                    new EmbedBuilder()
                    .setTitle(a.name ?? 'Attachment')
                    .setImage(a.proxyURL)
                    .setColor(0x007bff)
                    .setFooter({
                        text: formatSize(a.size)
                    })
                    .setTimestamp()
                );
            }
            else {
                files.push(a);
            }
        }

        await channel.send({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: message.author.tag,
                        iconURL: message.author.displayAvatarURL(),
                    },
                    color: 0x007bff,
                    description: (message.content ?? '').trim() === '' ? '*No content*' : message.content,
                    footer: {
                        text: `Received • ${message.id}`
                    },
                })
                .setTimestamp(),
                ...media
            ],
        });
            
        await (loggingChannel(client).send(embed(new EmbedBuilder({
            author: {
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL()
            },
            description: message.content,
            fields: [
                {
                    name: 'User ID',
                    value: message.author.id
                },
                {
                    name: 'Thread ID',
                    value: thread.id
                },
                {
                    name: 'Channel ID',
                    value: channel!.id
                },
                {
                    name: 'Message ID',
                    value: message.id
                }
            ],
            footer: {
                text: `Received`
            },
            color: 0x007bff
        }).setTimestamp(), ...media)));

        
        if (files.length > 0) {
            await channel.send({
                files
            });

            await (loggingChannel(client).send({
                files
            }));
        }

        await message.react('☑');
    }
}