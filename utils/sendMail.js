const nodemailer = require("nodemailer");

exports.sendOrderEmailToAdmin = async (order) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order Received - ${order.orderId}`,
    html: `
      <h2>New Order Received</h2>
      <p><b>Order ID:</b> ${order.orderId}</p>
      <p><b>Customer Name:</b> ${order.customerName}</p>
      <p><b>Email:</b> ${order.email}</p>
      <p><b>Phone:</b> ${order.phone}</p>
      <p><b>Address:</b> ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.zip}, ${order.address.country}</p>
      <h3>Products:</h3>
      <ul>
        ${order.products
          .map(
            (product) =>
              `<li>${product.name} - ₹${product.price} x ${product.quantity}</li>`
          )
          .join("")}
      </ul>
      <p><b>Total Amount:</b> ₹${order.amount}</p>
      <p><b>Status:</b> ${order.status}</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};