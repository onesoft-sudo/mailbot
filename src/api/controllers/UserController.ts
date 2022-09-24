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

import User from "../../models/User";
import Controller, { Action } from "../../utils/structures/Controller";
import Response from "../../utils/structures/Response";
import jsonwebtoken from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request } from "express";
import AuthMiddleware from "../middleware/AuthMiddleware";
import AuthenticatedRequest from "../../types/AuthenticatedRequest";

export default class UserController extends Controller {
    @Action('GET', '/users', [AuthMiddleware])
    async index() {
        return await User.find().select(['_id', 'username', 'discordID', 'createdAt']);
    }

    @Action('POST', '/users', [AuthMiddleware])
    async create(req: Request) {
        if (typeof req.body !== 'object' || !req.body || !req.body.username || !req.body.password || !req.body.discordID) {
            return { error: "Required fields are missing" };
        }

        const { username, password, discordID } = req.body;

        const token = await jsonwebtoken.sign({ username }, process.env.JWT_TOKEN!, {
            expiresIn: "2 days",
            issuer: 'MailBot System'
        });

        const user = new User({
            createdAt: new Date(),
            discordID,
            username,
            password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
            token
        });

        try {
            await user.save();
        }
        catch (e) {
            console.log(e);
            return { error: 'Internal error occurred' };
        }

        return {
            username: user.username,
            discordID: user.discordID,
            token,
            createdAt: user.createdAt
        };
    }

    @Action('POST', '/login')
    async login(req: Request) {
        if (typeof req.body !== 'object' || !req.body || !req.body.username || !req.body.password) {
            return { error: "Required fields are missing" };
        }

        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return { error: "Invalid username given" };
        }

        if (!(await bcrypt.compare(password, user.password))) {
            return { error: "Invalid password given" };
        }

        try {
            const data = jsonwebtoken.verify(user.token!, process.env.JWT_TOKEN!);
            console.log(data);
        }
        catch (e) {
            console.log("error", e);
            const token = await jsonwebtoken.sign({ username }, process.env.JWT_TOKEN!, {
                expiresIn: "2 days",
                issuer: 'MailBot System'
            });
    
            user.token = token;
            await user.save();
        }

        return {
            _id: user.id,
            username: user.username,
            token: user.token
        };
    }

    @Action('POST', '/logout', [AuthMiddleware])
    async logout(req: AuthenticatedRequest) {
        const { token } = req.user;

        try {
            const data = jsonwebtoken.verify(token!, process.env.JWT_TOKEN!);
            console.log(data);
        }
        catch (e) {
            console.log("error", e);
            return { error: 'Invalid access token, please log in again.' };
        }

        req.user.token = undefined;
        await req.user.save();

        return {
            _id: req.user.id,
            username: req.user.username,
            message: 'Successfully logged out'
        };
    }
}