import { Message, CommandInteraction, CacheType, EmbedBuilder, Attachment, TextChannel, ChatInputCommandInteraction, User } from "discord.js";
import Client from "../../client/Client";
import StaffMessage from "../../models/StaffMessage";
import Thread, { IThread } from "../../models/Thread";
import CommandOptions from "../../types/CommandOptions";
import BaseCommand from "../../utils/structures/BaseCommand";
import { getChannel, getGuild, loggingChannel } from "../../utils/utils";

export async function updateReply(client: Client, thread: IThread, id: string, { content, author }: { content: string, author: User }) {
    const channel = getChannel(client, thread!.channel) as TextChannel;

    try {
        const user = await (getGuild(client)?.members.fetch(thread.user));

        if (!user) {
            return;
        }

        let message: Message | undefined;
        let staffMessage = await StaffMessage.findOne({ threadMessageID: id });

        if (!staffMessage) {
            console.log("Not found");
            return false;
        }

        let isAnonymous: boolean = true;

        try {
            if (!user.dmChannel) {
                console.log('Reloading DM channel...');

                try {
                    await user.createDM(true);
                }
                catch (e) {
                    console.log(e);
                }
            }

            message = await user.dmChannel!.messages.fetch(staffMessage!.dmID);

            console.log(message);

            if (!message) {
                return false;
            }

            const { embeds } = message;
            
            const embed = embeds.shift();

            isAnonymous = embed?.author?.name === 'Staff';

            await message.edit({
                embeds: [
                    new EmbedBuilder({
                        author: {
                            name: isAnonymous ? 'Staff' : author.tag,
                            iconURL: isAnonymous ? client.user!.displayAvatarURL() : author.displayAvatarURL()
                        },
                        description: (content ?? '').trim() === '' ? '*No content*' : content,
                        footer: { text: `Received`, iconURL: getGuild(client)!.iconURL() ?? undefined },
                        color: 0x007bff
                    })
                    .setTimestamp(),
                    ...embeds
                ]
            });
        }
        catch (e) {
            console.log(e);
            return null;
        }

        const embed = new EmbedBuilder({
            author: {
                name: author.tag,
                iconURL: author.displayAvatarURL()
            },
            description: (content ?? '').trim() === '' ? '*No content*' : content,
            footer: { text: `${isAnonymous ? 'Anonymous' : 'Normal'} Reply (Updated) • ${message.id}` },
            color: 0x007bff
        }).setTimestamp();

        if (channel) {
            await channel.send({
                embeds: [
                    embed,
                ]
            });
        }

        await (loggingChannel(client).send({
            embeds: [
                new EmbedBuilder({
                    author: author ? {
                        name: author.tag,
                        iconURL: author.displayAvatarURL()
                    } : undefined,
                    title: 'Reply Updated',
                    description: 'A message was updated by **' + author.tag + '**.',
                    fields: [
                        {
                            name: 'Thread ID',
                            value: thread.id
                        },
                        {
                            name: 'Channel ID',
                            value: thread.channel
                        },
                        {
                            name: 'DM ID',
                            value: staffMessage.dmID
                        },
                        {
                            name: 'Thread Message ID',
                            value: id
                        },
                        {
                            name: 'Sent to',
                            value: user!.user.tag + ` (${user!.user.id})`
                        },
                    ],
                    footer: {
                        text: `Updated`
                    },
                    color: 0x007bff
                })
                .setTimestamp(),
                embed,
            ]
        }));

        return { channel, message, member: user };
    }
    catch (e) {
        console.log(e);     
    }
}

export default class EditCommand extends BaseCommand {   
    public mailOnly: boolean = true;

    constructor() {
        super('edit', 'mailing', ['u', 'um', 'updatemsg', 'e', 'update', 'editmsg']);
    }

    async run(client: Client, message: Message<boolean> | ChatInputCommandInteraction<CacheType>, options?: CommandOptions | undefined): Promise<void> {
        if (options && options.args[1] === undefined) {
            await message.reply({
                embeds: [
                    {
                        description: ':x: You must specify a message ID and the new content to edit.',
                        color: 0xf14a60
                    }
                ]
            });

            return;
        }
        
        let content = '', id = '';

        if (options) {
            const [newId, ...args] = options.rawArgs;
            id = newId;
            content = args.join(' ');
        }
        else if (message instanceof ChatInputCommandInteraction) {
            content = message.options.getString('content')!;
            id = message.options.getString('message')!;
            await message.deferReply({ ephemeral: true });
        }

        const thread = await Thread.findOne({ channel: message.channel!.id });

        if (!thread) {
            await this.deferedReply(message, {
                content: ':x: This thread is already closed or deleted.'
            });

            return;
        }

        const result = await updateReply(client, thread, id, {
            content,
            author: message.member!.user as User,
        });

        if (result === false) {
            this.deferedReply(message, ":x: The given message does not exist.");
        }
        else if (message instanceof ChatInputCommandInteraction) {
            this.deferedReply(message, "Message updated successfully.");
        }
    }
}