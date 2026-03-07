const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

let transporter = null;

// Initialize Ethereal transpoter (fake SMTP service for testing)
const initEmailService = async () => {
  if (transporter) return;
  
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('📧 Ethereal Email Transport Initialized for local development.');
  } catch (err) {
    console.error('Failed to initialize Ethereal Email Transport:', err);
  }
};

/**
 * Generate a PDF buffer for the E-Ticket
 */
const generateTicketPDF = async (bookingDetails) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Content
      doc.fontSize(24).fillColor('#4338ca').text('CineBooking E-Ticket', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(18).fillColor('#111827').text(`Movie: ${bookingDetails.movie_title}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).fillColor('#4b5563');
      doc.text(`Booking ID: #${bookingDetails.id.toString().padStart(6, '0')}`);
      doc.text(`Status: CONFIRMED`);
      doc.text(`Date & Time: ${new Date(bookingDetails.start_time).toLocaleString()}`);
      doc.text(`Theater: ${bookingDetails.theater_name} - ${bookingDetails.theater_location}`);
      doc.text(`Screen: ${bookingDetails.screen_name}`);
      doc.text(`Seats: ${bookingDetails.seat_numbers}`);
      doc.text(`Total Paid: INR ${bookingDetails.total_price} (${bookingDetails.payment_method})`);
      doc.moveDown(2);

      // Embedded Base64 QR code in PDF
      if (bookingDetails.qr_code && bookingDetails.qr_code.startsWith('data:image/png;base64,')) {
        const base64Data = bookingDetails.qr_code.replace(/^data:image\/png;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, { fit: [150, 150], align: 'center', valign: 'center' });
      }

      doc.moveDown();
      doc.text('Present this QR code at the theater entrance.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Send an email with the PDF ticket attached
 */
const sendTicketEmail = async (userEmail, bookingDetails) => {
  try {
    await initEmailService();
    if (!transporter) return;

    // Generate PDF stream
    const pdfBuffer = await generateTicketPDF(bookingDetails);

    // Send Mail
    const info = await transporter.sendMail({
      from: '"CineBooking Platform" <noreply@cinebooking.com>',
      to: userEmail,
      subject: `🎬 Your E-Ticket for ${bookingDetails.movie_title} is Confirmed!`,
      text: `Your booking for ${bookingDetails.movie_title} is confirmed.\nBooking ID: #${bookingDetails.id}\nTheater: ${bookingDetails.theater_name}\nSeats: ${bookingDetails.seat_numbers}\n\nPlease find your E-Ticket PDF attached.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 20px; border-radius: 10px;">
          <h2 style="color: #4338ca; text-align: center;">CineBooking Confirmation</h2>
          <p>Hi there,</p>
          <p>Your booking for <strong>${bookingDetails.movie_title}</strong> is confirmed!</p>
          <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0;">
            <p><strong>Booking ID:</strong> #${bookingDetails.id.toString().padStart(6, '0')}</p>
            <p><strong>Theater:</strong> ${bookingDetails.theater_name} - ${bookingDetails.screen_name}</p>
            <p><strong>Time:</strong> ${new Date(bookingDetails.start_time).toLocaleString()}</p>
            <p><strong>Seats:</strong> ${bookingDetails.seat_numbers}</p>
          </div>
          <p>Please find your digital E-Ticket attached as a PDF. Present the QR code in the PDF at the theater entrance.</p>
          <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">CineBooking Automated System</p>
        </div>
      `,
      attachments: [
        {
          filename: `ETicket_${bookingDetails.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`✉️ Ticketing Email Sent to: ${userEmail}`);
    // Ethereal specific console log to grab the test URL
    console.log(`🔗 Preview Email URL: ${nodemailer.getTestMessageUrl(info)}`);
    
    return nodemailer.getTestMessageUrl(info);
  } catch (error) {
    console.error('Error sending ticket email:', error);
  }
};

module.exports = {
  sendTicketEmail
};
