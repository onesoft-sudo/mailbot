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

import { Request } from "express";
import { isValidObjectId } from "mongoose";
import DiscordClient from "../../client/Client";
import { createThread } from "../../events/dm/DMCreateEvent";
import Thread from "../../models/Thread";
import Controller, { Action } from "../../utils/structures/Controller";
import Response from "../../utils/structures/Response";
import { client, fetchUser, getChannel, getGuild } from "../../utils/utils";
import AuthMiddleware from "../middleware/AuthMiddleware";

export default class ThreadController extends Controller {
    middleware(): { [action: string]: Function[]; } {
        return { "*": [AuthMiddleware] };
    }

    @Action('GET', '/threads')
    async index() {
        const threads = await Thread.find().limit(30);
        const transformed = [];

        for await (const thread of threads) {
            transformed.push({
                ...thread.toJSON(),
                channel: getChannel(client(), thread.channel),
                user: await fetchUser(client(), thread.user),
                createdBy: await fetchUser(client(), thread.createdBy),
            });
        }

        return transformed;
    }

    @Action('POST', '/threads')
    async create(request: Request) {
        const { body } = request;

        if (typeof body !== 'object' || !body.user) {
            return { error: "Request body must be a valid object." };
        }

        try {
            const member = await (getGuild(client()))?.members.fetch(body.user);

            if (!member) {
                throw new Error("Member not found");
            }

            return await createThread(client(), null, member.user);
        }
        catch (e) {
            console.log(e);
            return { error: "Invalid user ID or failed to fetch user information." };
        }
    }

    @Action('GET', '/threads/:id')
    async view(request: Request) {
        if (!isValidObjectId(request.params.id)) {
            return new Response(400, { error: 'Not a valid ID' });
        }

        try {
            const thread = await Thread.findById(request.params.id);

            if (!thread) {
                throw new Error('Not found');
            }

            return {
                ...thread.toJSON(),
                channel: getChannel(client(), thread.channel),
                user: await fetchUser(client(), thread.user),
                createdBy: await fetchUser(client(), thread.createdBy),
            };
        }
        catch (e) {
            console.log(e);
            return new Response(404, { error: 'Not found' });
        }
    }
}