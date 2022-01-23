import nodemailer from "nodemailer";
const enviromentVars = require("dotenv").config().parsed;

// Notify the user about their password change
const send_email_change_password = async (address: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: enviromentVars._email_name_.toString(),
      pass: enviromentVars.__password__.toString(),
    },
  });
  let email_sent = await transporter.sendMail({
    from: enviromentVars._email_name_.toString(),
    to: address,
    subject: "Your password for Bloggy has been changed.",
    html: `<center>
          <h2> Your password for Bloggy was just changed. </h2>
          <p> If this wasn't you, <a href="https://example.com/change-user-password/"> then you can change it again.</a> </p>
      </center>
      `,
  });
  if (email_sent) return true;
};

export default send_email_change_password;
