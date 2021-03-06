import nodemailer from "nodemailer";
const enviromentVars = require("dotenv").config().parsed;

// Send a welcome email to the new user after they sign up
const send_email = async (
  address: string,
  veri_code: string,
  fullURL: string
) => {
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
    subject: "Welcome To Bloggy!",
    html: `<center>
      <h1>Welcome To Bloggy</h1>
      <h2>Get Started With Bloggy!</h2>
      <a href='${fullURL}?code=${veri_code}'> Verify My Email </a>
      </center>
      `,
  });
  if (email_sent) return true;
};

export default send_email;
