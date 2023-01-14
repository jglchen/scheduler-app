import { AppointPeriod, MailOptions } from './types';

export const timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function getDateString(timenum: number, timezone?: string): string{
    const dateObj = new Date(timenum*1000);
    if (typeof timezone !== 'undefined'){
        return `${dateObj.toLocaleDateString('en-US', {timeZone: `${timezone}`})} ${dateObj.toLocaleTimeString('en-US', {timeZone: `${timezone}`, timeZoneName: 'short', hour: '2-digit', minute: '2-digit'})}`;
    }
    return `${dateObj.toLocaleDateString('en-US')} ${dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`;
}

export function confirmRequestHTML(userName: string, appointPeriod: AppointPeriod, confirmUrl: string, timezone: string, prevAppointPeriod?: AppointPeriod): string{
    let inviteStatement: string;
    if (typeof prevAppointPeriod !== 'undefined'){
        inviteStatement = `${userName} already changed the appointment with you from ${getDateString(prevAppointPeriod.startTime, timezone)} -- ${getDateString(prevAppointPeriod.endTime, timezone)} to ${getDateString(appointPeriod.startTime, timezone)} -- ${getDateString(appointPeriod.endTime, timezone)}.`;
    }else{
        inviteStatement = `${userName} invited you to join the appointment on ${getDateString(appointPeriod.startTime, timezone)} -- ${getDateString(appointPeriod.endTime, timezone)}.`;
    }

    const htmlStr: string =  
    `
    <html>
    <body style="font-family: Arial, sans-serif;">
    <p>Hello,</p>
    <p>${inviteStatement} If you accept the invitation, please click the following <b>Accept Invitation</b>. 
    </p>
    <a href="${confirmUrl}">
    <button style="-webkit-appearance: none;display: inline-block;border: 1px solid #0366EE;border-radius: 4px;background: #0366EE;color: #ffffff;font-weight: 600;font-family: -apple-system, BlinkMacSystemFont, Helvetica Neue, Helvetica, Arial, sans-serif;font-size: 1rem;text-transform: none;padding: .75rem 1.25rem;margin: 0 2.5rem .5rem 0;vertical-align: middle;text-align: center;cursor: pointer;text-decoration: none;line-height: 1;">Accept Invitation</button>
    </a>
    <p>Thanks,</p>
    Your Appointment Scheduler Application Team
    </body>
    </html>
    `;

    return htmlStr;
}

export function confirmMailOptions(userName: string, email: string, appointPeriod: AppointPeriod, token: string, confirmUrl: string, senderMail: string, timezone: string, prevAppointPeriod?: AppointPeriod): MailOptions{
    const confirmUrlLink = `${confirmUrl}/${token}?email=${email}`;
    const mailOptions = {
        from: `"No Reply - Appointment Scheduler Application " <${senderMail}>`, // sender address (who sends)
        to: email, // list of receivers (who receives)
        subject: "Confirm Appointment Invitation for Appointment Scheduler", // Subject line
        html: confirmRequestHTML(userName, appointPeriod, confirmUrlLink, timezone, prevAppointPeriod)
    };

    return mailOptions;
}    

export function removeScheduleHTML(userName: string, appointPeriod: AppointPeriod, timezone: string): string{
    const htmlStr =  
    `
    <html>
    <body style="font-family: Arial, sans-serif;">
    <p>Hello,</p>
    <p>Please noticed ${userName} already canceled the appointment with you on ${getDateString(appointPeriod.startTime, timezone)} -- ${getDateString(appointPeriod.endTime, timezone)}. 
    </p>
    <p>Thanks,</p>
    Your Appointment Scheduler Application Team
    </body>
    </html>
    `;

    return htmlStr;
}

export function removeScheduleOptions(userName: string, email: string, appointPeriod: AppointPeriod, timezone: string, senderMail: string): MailOptions{
    const mailOptions = {
        from: `"No Reply - Appointment Scheduler Application " <${senderMail}>`, // sender address (who sends)
        to: email, // list of receivers (who receives)
        subject: "Cancel Appointment Notice for Appointment Scheduler", // Subject line
        html: removeScheduleHTML(userName, appointPeriod, timezone)
    };

    return mailOptions;
} 

export function passwdResetHTML(numForCheck: string): string{
    const htmlStr =  
    `
    <html>
    <body style="font-family: Arial, sans-serif;">
    <p>Hello,</p>
    <p>Please fill the following number in the designated box field of the page.</p>
    <p style="font-weight: 600; font-size: 24pt;">${numForCheck}</p>
    <p>Thanks,</p>
    Your Appointment Scheduler Application Team
    </body>
    </html>
    `;

    return htmlStr;
}

