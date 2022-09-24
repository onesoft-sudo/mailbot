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

import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import User from "../../models/User";
import AuthenticatedRequest from "../../types/AuthenticatedRequest";

export default async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        res.status(400).send({
            error: 'No authorization header provided in the request'
        });

        return;
    }

    const { authorization } = req.headers;

    if (!/Bearer ([^\s]+)/gi.test(authorization)) {
        res.status(400).send({
            error: 'Invalid authorization header provided'
        });

        return;
    }

    const [, token] = authorization.split(' ');

    const user = await User.findOne({ token });

    if (!user) {
        res.status(401).send({
            error: 'Invalid authorization token provided'
        });

        return;
    }

    try {
        jsonwebtoken.verify(token, process.env.JWT_TOKEN!);
    }
    catch (e) {
        console.log(e);

        res.status(401).send({
            error: 'Invalid authorization token provided'
        });

        return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
}