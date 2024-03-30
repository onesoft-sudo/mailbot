package org.onesoftnet.mailbot.mailing

enum class MailMessageType(val value: String) {
    USER_REPLY("user_reply"),
    SYSTEM_MESSAGE("system_message"),
    STAFF_REPLY("staff_reply"),
    SYSTEM_EVENT("system_event");

    override fun toString() = value
}