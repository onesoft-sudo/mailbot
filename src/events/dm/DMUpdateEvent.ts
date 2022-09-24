import { Attachment, AttachmentBuilder, EmbedBuilder, Message, TextChannel, User } from "discord.js";
import DiscordClient from "../../client/Client";
import Client from "../../client/Client";
import BlockedUser from "../../models/BlockedUser";
import Thread from "../../models/Thread";
import BaseEvent from "../../utils/structures/BaseEvent";
import { embed, formatSize, getChannel, loggingChannel, mailCategory } from "../../utils/utils";

export default class DMUpdateEvent extends BaseEvent {
    constructor() {
        super('dmUpdate');
    }

    async run(client: Client, oldMessage: Message, newMessage: Message) {
        const blockedUser = await BlockedUser.findOne({ discordID: newMessage.author.id });

        if (blockedUser) {
            return;
        }

        let thread = await Thread.findOne({ user: newMessage.author.id });
        
        if (!thread) {
           return;
        }
        
        let channel = <TextChannel> await getChannel(client, thread.channel);

        if (!channel) {
            return;
        }

        await channel.send({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: newMessage.author.tag,
                        iconURL: newMessage.author.displayAvatarURL(),
                    },
                    description: `**===Before===**\n${oldMessage.content}\n\n**+++===After===**\n${newMessage.content}`,
                    footer: {
                        text: `Updated • ${newMessage.id}`
                    },
                    color: 0x007bff
                })
                .setTimestamp()
            ]
        });

        loggingChannel(client).send(embed(new EmbedBuilder({
            author: {
                name: newMessage.author.tag,
                iconURL: newMessage.author.displayAvatarURL()
            },
            title: 'Message Updated',
            description: `**===Before===**\n${oldMessage.content}\n\n**+++===After===**\n${newMessage.content}`,
            fields: [
                {
                    name: 'User ID',
                    value: newMessage.author.id
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
                    value: newMessage.id
                }
            ],
            footer: {
                text: `Updated`
            },
            color: 0x007bff
        }).setTimestamp()));
        
        await newMessage.reply({
            embeds: [
                new EmbedBuilder({
                    description: 'Message updated successfully!',
                    color: 0x007bff,
                    footer: {
                        text: 'Updated'
                    }
                })
                .setTimestamp()
            ]
        });
    }
}