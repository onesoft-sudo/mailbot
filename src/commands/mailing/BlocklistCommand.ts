import { Message, CommandInteraction, CacheType, ChatInputCommandInteraction } from "discord.js";
import Client from "../../client/Client";
import BlockedUser from "../../models/BlockedUser";
import CommandOptions from "../../types/CommandOptions";
import BaseCommand from "../../utils/structures/BaseCommand";
import { formatDistance, subDays } from 'date-fns';

export default class BlocklistCommand extends BaseCommand {
    constructor() {
        super('blocklist', 'mailing', ['blk']);
    }

    async run(client: Client, message: Message<boolean> | CommandInteraction<CacheType>, options?: CommandOptions | undefined): Promise<void> {
        if (message instanceof ChatInputCommandInteraction) 
            await message.deferReply();

        const blocklist = await BlockedUser.find().limit(50);
        let content = '';
        
        for await (const user of blocklist) {
            let userData = null;

            try {
                userData = client.users.cache.get(user.discordID) || (await client.users.fetch(user.discordID));
            }
            catch (e) {
                console.log(e);
            }

            content += `${userData ? userData.tag : user.discordID} | ${formatDistance(new Date(), user.createdAt, { addSuffix: true })}\n`;
        }

        content = '**Blocklist**\n\n```' + (content === '' ? 'No blocked user.\n```' : (content + '```'));

        await this.deferedReply(message, {
            content
        });
    }
}