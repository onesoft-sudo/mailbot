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

import mongoose from "mongoose";

const schema = new mongoose.Schema({
    dmID: {
        type: String,
        required: true,
        unique: true
    },
    threadMessageID: {
        type: String,
        required: true,
        unique: true
    },
    fileMessage: {
        type: String,
        required: false,
    }
});

export default mongoose.model('StaffMessage', schema);