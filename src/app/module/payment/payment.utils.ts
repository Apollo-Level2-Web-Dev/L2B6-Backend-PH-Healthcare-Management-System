import PDFDocument from 'pdfkit';

interface InvoiceData {
    invoiceId: string;
    patientName: string;
    patientEmail: string;
    doctorName: string;
    appointmentDate: string;
    amount: number;
    transactionId: string;
    paymentDate: string;
}

export const generateInvoicePdf = async (data: InvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });

            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on('error', (error) => {
                reject(error);
            });

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', {
                align: 'center',
            });

            doc.moveDown(0.5);
            doc
                .fontSize(10)
                .font('Helvetica')
                .text('PH Healthcare Services', {
                    align: 'center',
                });
            doc.text('Your Health, Our Priority', { align: 'center' });

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Invoice Details - Left Column
            doc.fontSize(11).font('Helvetica-Bold').text('Invoice Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Invoice ID: ${data.invoiceId}`)
                .text(`Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}`)
                .text(`Transaction ID: ${data.transactionId}`);

            doc.moveDown(0.8);

            // Patient Information
            doc.fontSize(11).font('Helvetica-Bold').text('Patient Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${data.patientName}`)
                .text(`Email: ${data.patientEmail}`);

            doc.moveDown(0.8);

            // Doctor Information
            doc.fontSize(11).font('Helvetica-Bold').text('Doctor Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${data.doctorName}`);

            doc.moveDown(0.8);

            // Appointment Details
            doc.fontSize(11).font('Helvetica-Bold').text('Appointment Details');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Appointment Date: ${new Date(data.appointmentDate).toLocaleDateString()}`);

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Amount Table
            const tableTop = doc.y;
            const col1X = 50;
            const col2X = 450;

            doc.fontSize(11).font('Helvetica-Bold').text('Payment Summary', col1X, tableTop);

            doc.moveDown(0.8);

            // Table Header
            const headerY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Description', col1X, headerY);
            doc.text('Amount', col2X, headerY, { align: 'right' });

            // Separator line
            doc.moveTo(col1X, doc.y).lineTo(col2X + 80, doc.y).stroke();

            doc.moveDown(0.5);

            // Amount Row
            const amountY = doc.y;
            doc.fontSize(10).font('Helvetica');
            doc.text('Consultation Fee', col1X, amountY);
            doc.text(`${data.amount.toFixed(2)} BDT`, col2X, amountY, { align: 'right' });

            doc.moveDown(0.8);

            // Total Row
            const totalY = doc.y;
            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Total Amount', col1X, totalY);
            doc.text(`${data.amount.toFixed(2)} BDT`, col2X, totalY, { align: 'right' });

            // Separator line
            doc.moveTo(col1X, doc.y).lineTo(col2X + 80, doc.y).stroke();

            doc.moveDown(1.5);

            // Footer
            doc.fontSize(9).font('Helvetica').text(
                'Thank you for choosing PH Healthcare. This is an electronically generated invoice.',
                {
                    align: 'center',
                }
            );

            doc.text('If you have any questions, please contact us at support@ph-healthcare.com', {
                align: 'center',
            });

            doc.text('Payment processed securely through Stripe', {
                align: 'center',
            });

            // End the document
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};