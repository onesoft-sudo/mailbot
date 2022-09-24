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