const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateInvoice(order) {
    return new Promise((resolve, reject) => {
        const invoicesFolder = path.join(__dirname, "../invoices"); // ✅ Correct Folder Path

        // ✅ अगर फोल्डर नहीं है, तो इसे बनाओ
        if (!fs.existsSync(invoicesFolder)) {
            fs.mkdirSync(invoicesFolder, { recursive: true });
        }

        const filePath = path.join(invoicesFolder, `${order.orderId}.pdf`);
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ✅ Invoice Content
        doc.fontSize(20).text("Order Invoice", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Order ID: ${order.orderId}`);
        doc.text(`Customer Name: ${order.customerName}`);
        doc.text(`Email: ${order.email}`);
        doc.text(`Phone: ${order.phone}`);
        doc.text(`Address: ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.zip}`);

        doc.moveDown().fontSize(14).text("Products Ordered:");
        order.products.forEach((product, index) => {
            doc.text(`${index + 1}. ${product.name} - ₹${product.price}`);
        });

        doc.moveDown().fontSize(14).text(`Total Amount: ₹${order.amount}`);

        doc.end();

        stream.on("finish", () => resolve(filePath));
        stream.on("error", reject);
    });
}

module.exports = { generateInvoice };
