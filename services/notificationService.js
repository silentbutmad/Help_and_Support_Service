import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

let transporter = null;

export const initializeEmailTransporter = () => {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn('Email configuration not found. Email notifications will be disabled.');
      return null;
    }

    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    logger.info('Email transporter initialized successfully');
    return transporter;
  } catch (error) {
    logger.error(`Error initializing email transporter: ${error.message}`);
    return null;
  }
};

export const sendEmail = async (to, subject, html) => {
  try {
    if (!transporter) {
      transporter = initializeEmailTransporter();
    }

    if (!transporter) {
      logger.warn(`Email not sent to ${to}: Email transporter not configured`);
      return false;
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    });

    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    return false;
  }
};

export const sendTicketCreatedNotification = async (ticket) => {
  const subject = `Support Ticket Created - ${ticket.id}`;
  const html = `
    <h2>Support Ticket Created</h2>
    <p>Dear ${ticket.user.name},</p>
    <p>Your support ticket has been created successfully.</p>
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>Ticket ID:</strong> ${ticket.id}</li>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>Issue Type:</strong> ${ticket.issueType}</li>
      <li><strong>Priority:</strong> ${ticket.priority}</li>
      <li><strong>Status:</strong> ${ticket.status}</li>
      <li><strong>Created At:</strong> ${new Date(ticket.createdAt).toLocaleString()}</li>
    </ul>
    <p>We will get back to you soon. You can track your ticket status in the support section.</p>
    <p>Thank you for contacting us!</p>
  `;

  await sendEmail(ticket.user.email, subject, html);
};

export const sendTicketAssignedNotification = async (ticket, agent) => {
  const subject = `Ticket Assigned - ${ticket.id}`;
  const html = `
    <h2>Ticket Assigned to You</h2>
    <p>Dear ${agent.name},</p>
    <p>A support ticket has been assigned to you.</p>
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>Ticket ID:</strong> ${ticket.id}</li>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>Description:</strong> ${ticket.description}</li>
      <li><strong>Issue Type:</strong> ${ticket.issueType}</li>
      <li><strong>Priority:</strong> ${ticket.priority}</li>
      <li><strong>Status:</strong> ${ticket.status}</li>
      <li><strong>User:</strong> ${ticket.user.name} (${ticket.user.email})</li>
    </ul>
    <p>Please review and take necessary action.</p>
  `;

  await sendEmail(agent.email, subject, html);
};

export const sendStatusChangeNotification = async (ticket, oldStatus, newStatus) => {
  const subject = `Ticket Status Updated - ${ticket.id}`;
  const html = `
    <h2>Ticket Status Updated</h2>
    <p>Dear ${ticket.user.name},</p>
    <p>Your support ticket status has been updated.</p>
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>Ticket ID:</strong> ${ticket.id}</li>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>Old Status:</strong> ${oldStatus}</li>
      <li><strong>New Status:</strong> ${newStatus}</li>
    </ul>
    <p>You can view the updated ticket in the support section.</p>
  `;

  await sendEmail(ticket.user.email, subject, html);
};

export const sendNewCommentNotification = async (ticket, comment) => {
  const subject = `New Comment on Ticket - ${ticket.id}`;
  const html = `
    <h2>New Comment Added</h2>
    <p>Dear ${ticket.user.name},</p>
    <p>A new comment has been added to your support ticket.</p>
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>Ticket ID:</strong> ${ticket.id}</li>
      <li><strong>Title:</strong> ${ticket.title}</li>
    </ul>
    <h3>Comment:</h3>
    <p>${comment.message}</p>
    <p><strong>Added by:</strong> ${comment.user.name}</p>
    <p><strong>Time:</strong> ${new Date(comment.createdAt).toLocaleString()}</p>
  `;

  await sendEmail(ticket.user.email, subject, html);
};

export const sendWhatsAppNotification = async (phoneNumber, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
      logger.warn('Twilio configuration not found. WhatsApp notifications will be disabled.');
      return false;
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: message
    });

    logger.info(`WhatsApp notification sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    logger.error(`Error sending WhatsApp notification to ${phoneNumber}: ${error.message}`);
    return false;
  }
};