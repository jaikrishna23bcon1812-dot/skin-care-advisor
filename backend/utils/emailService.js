const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendReminderEmail(user, routine) {
    try {
        const mailOptions = {
            from: `"SkinCare AI" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "🌿 Your Daily Skincare Reminder",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff5f8; border-radius: 15px;">
                    <div style="text-align: center; padding: 20px;">
                        <h1 style="color: #d81b60; margin: 0;">SkinCare AI</h1>
                        <p style="color: #666;">Your Daily Skincare Reminder</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 15px;">
                        <h2 style="color: #d81b60;">Hi ${user.name}! 👋</h2>
                        <p style="color: #333; font-size: 16px;">It's time for your skincare routine. Consistency is key!</p>
                        <div style="background: #fff5f8; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #d81b60; margin-top: 0;">💧 Morning Routine</h3>
                            <ul style="color: #333;">
                                <li>Cleanser</li>
                                <li>Serum</li>
                                <li>Moisturizer</li>
                                <li>Sunscreen</li>
                            </ul>
                        </div>
                        <div style="background: #f3e5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #7b1fa2; margin-top: 0;">🌙 Night Routine</h3>
                            <ul style="color: #333;">
                                <li>Cleanser</li>
                                <li>Treatment</li>
                                <li>Moisturizer</li>
                            </ul>
                        </div>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://skin-care-advisor-frontend.vercel.app/dashboard.html" 
                               style="background: linear-gradient(135deg, #d81b60, #7b1fa2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                                Open Dashboard
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p>© 2026 SkinCare AI. Made with 💗</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("Email send error:", error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { sendReminderEmail };
