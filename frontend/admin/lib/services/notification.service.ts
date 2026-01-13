/**
 * Email & SMS Notification Service
 * Gestione invio notifiche ordini via email e SMS
 */

import {
  generateOrderConfirmationEmail,
  orderConfirmationSubject,
} from '@/components/orders/email-templates/order-confirmation'
import {
  generateShippingNotificationEmail,
  shippingNotificationSubject,
} from '@/components/orders/email-templates/shipping-notification'
import {
  generateRefundNotificationEmail,
  refundNotificationSubject,
} from '@/components/orders/email-templates/refund-notification'
import {
  generateOrderCancelledEmail,
  orderCancelledSubject,
} from '@/components/orders/email-templates/order-cancelled'

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

interface SMSOptions {
  to: string
  message: string
}

/**
 * Notification Service
 * Gestisce invio email e SMS per ordini
 */
export class NotificationService {
  private emailProvider: 'sendgrid' | 'resend' | 'ses'
  private smsProvider: 'twilio' | 'vonage'
  private fromEmail: string
  private fromName: string

  constructor() {
    this.emailProvider =
      (process.env.NEXT_PUBLIC_EMAIL_PROVIDER as any) || 'sendgrid'
    this.smsProvider = (process.env.NEXT_PUBLIC_SMS_PROVIDER as any) || 'twilio'
    this.fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@example.com'
    this.fromName = process.env.NEXT_PUBLIC_FROM_NAME || 'Your Store'
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(orderData: {
    orderNumber: string
    orderDate: Date
    customerName: string
    customerEmail: string
    items: any[]
    shippingAddress: any
    totals: any
  }): Promise<boolean> {
    try {
      const html = generateOrderConfirmationEmail({
        orderNumber: orderData.orderNumber,
        orderDate: orderData.orderDate,
        customerName: orderData.customerName,
        items: orderData.items,
        shippingAddress: orderData.shippingAddress,
        totals: orderData.totals,
      })

      await this.sendEmail({
        to: orderData.customerEmail,
        subject: orderConfirmationSubject(orderData.orderNumber),
        html,
      })

      // Send SMS notification
      if (orderData.shippingAddress.phone) {
        await this.sendSMS({
          to: orderData.shippingAddress.phone,
          message: `Grazie per il tuo ordine ${orderData.orderNumber}! Ti invieremo aggiornamenti sulla spedizione.`,
        })
      }

      return true
    } catch (error) {
      console.error('Error sending order confirmation:', error)
      return false
    }
  }

  /**
   * Send shipping notification
   */
  async sendShippingNotification(shipmentData: {
    orderNumber: string
    customerName: string
    customerEmail: string
    customerPhone?: string
    carrier: string
    trackingNumber: string
    trackingUrl: string
    estimatedDelivery: Date
    items: any[]
    shippingAddress: any
  }): Promise<boolean> {
    try {
      const html = generateShippingNotificationEmail({
        orderNumber: shipmentData.orderNumber,
        customerName: shipmentData.customerName,
        carrier: shipmentData.carrier,
        trackingNumber: shipmentData.trackingNumber,
        trackingUrl: shipmentData.trackingUrl,
        estimatedDelivery: shipmentData.estimatedDelivery,
        items: shipmentData.items,
        shippingAddress: shipmentData.shippingAddress,
      })

      await this.sendEmail({
        to: shipmentData.customerEmail,
        subject: shippingNotificationSubject(shipmentData.orderNumber),
        html,
      })

      // Send SMS notification
      if (shipmentData.customerPhone) {
        await this.sendSMS({
          to: shipmentData.customerPhone,
          message: `Il tuo ordine ${shipmentData.orderNumber} è stato spedito! Tracking: ${shipmentData.trackingNumber}`,
        })
      }

      return true
    } catch (error) {
      console.error('Error sending shipping notification:', error)
      return false
    }
  }

  /**
   * Send refund notification
   */
  async sendRefundNotification(refundData: {
    orderNumber: string
    customerName: string
    customerEmail: string
    refundAmount: number
    refundReason: string
    items: any[]
    paymentMethod: string
  }): Promise<boolean> {
    try {
      const html = generateRefundNotificationEmail({
        orderNumber: refundData.orderNumber,
        customerName: refundData.customerName,
        refundAmount: refundData.refundAmount,
        refundReason: refundData.refundReason,
        items: refundData.items,
        paymentMethod: refundData.paymentMethod,
        estimatedProcessingDays: 5,
      })

      await this.sendEmail({
        to: refundData.customerEmail,
        subject: refundNotificationSubject(
          refundData.orderNumber,
          refundData.refundAmount
        ),
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending refund notification:', error)
      return false
    }
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(cancellationData: {
    orderNumber: string
    customerName: string
    customerEmail: string
    cancellationReason: string
    refundIssued: boolean
    refundAmount?: number
    items: any[]
  }): Promise<boolean> {
    try {
      const html = generateOrderCancelledEmail({
        orderNumber: cancellationData.orderNumber,
        customerName: cancellationData.customerName,
        cancellationReason: cancellationData.cancellationReason,
        refundIssued: cancellationData.refundIssued,
        refundAmount: cancellationData.refundAmount,
        items: cancellationData.items,
      })

      await this.sendEmail({
        to: cancellationData.customerEmail,
        subject: orderCancelledSubject(cancellationData.orderNumber),
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending cancellation notification:', error)
      return false
    }
  }

  /**
   * Send email using configured provider
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, html } = options
    const from = `${this.fromName} <${this.fromEmail}>`

    switch (this.emailProvider) {
      case 'sendgrid':
        await this.sendWithSendGrid({ to, from, subject, html })
        break
      case 'resend':
        await this.sendWithResend({ to, from, subject, html })
        break
      case 'ses':
        await this.sendWithSES({ to, from, subject, html })
        break
      default:
        console.log('Email would be sent:', { to, subject })
    }
  }

  /**
   * Send SMS using configured provider
   */
  private async sendSMS(options: SMSOptions): Promise<void> {
    const { to, message } = options

    switch (this.smsProvider) {
      case 'twilio':
        await this.sendWithTwilio({ to, message })
        break
      case 'vonage':
        await this.sendWithVonage({ to, message })
        break
      default:
        console.log('SMS would be sent:', { to, message })
    }
  }

  // Email Provider Implementations
  private async sendWithSendGrid(options: EmailOptions): Promise<void> {
    // TODO: Implement SendGrid integration
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // await sgMail.send(options)
    console.log('SendGrid email:', options)
  }

  private async sendWithResend(options: EmailOptions): Promise<void> {
    // TODO: Implement Resend integration
    // const { Resend } = require('resend')
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send(options)
    console.log('Resend email:', options)
  }

  private async sendWithSES(options: EmailOptions): Promise<void> {
    // TODO: Implement AWS SES integration
    // const AWS = require('aws-sdk')
    // const ses = new AWS.SES()
    // await ses.sendEmail({ ... }).promise()
    console.log('SES email:', options)
  }

  // SMS Provider Implementations
  private async sendWithTwilio(options: SMSOptions): Promise<void> {
    // TODO: Implement Twilio integration
    // const twilio = require('twilio')
    // const client = twilio(accountSid, authToken)
    // await client.messages.create({
    //   body: options.message,
    //   to: options.to,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // })
    console.log('Twilio SMS:', options)
  }

  private async sendWithVonage(options: SMSOptions): Promise<void> {
    // TODO: Implement Vonage (Nexmo) integration
    // const Vonage = require('@vonage/server-sdk')
    // const vonage = new Vonage({ ... })
    // await vonage.message.sendSms(...)
    console.log('Vonage SMS:', options)
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
