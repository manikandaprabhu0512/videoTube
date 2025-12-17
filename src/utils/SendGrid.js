import sgMail from "@sendgrid/mail";

export const sendEmail = async ({ to, subject, html }) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  try {
    await sgMail.send({
      to,
      from: {
        name: "Videogram Support",
        email: process.env.SENDGRID_FROM_EMAIL,
      },
      subject,
      html,
    });
  } catch (error) {
    console.error("SENDGRID ERROR:", error.response?.body || error);
    throw new Error("Email sending failed");
  }
};
