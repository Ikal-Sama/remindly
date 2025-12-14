interface TaskReminderEmailProps {
  userName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate?: Date;
  reminderDate?: Date;
  isPro: boolean;
}

export const taskReminderEmail = ({
  userName,
  taskTitle,
  taskDescription,
  dueDate,
  reminderDate,
  isPro,
}: TaskReminderEmailProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reminder</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .task-title {
          font-size: 24px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 15px;
        }
        .task-description {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-left: 4px solid #667eea;
        }
        .date-info {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .date-label {
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 5px;
        }
        .date-value {
          color: #2d3748;
          font-size: 16px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #718096;
          font-size: 14px;
        }
        .pro-badge {
          background: #48bb78;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-left: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 Task Reminder</h1>
        <p>Hi ${userName}, here's your task reminder!</p>
      </div>
      
      <div class="content">
        <div class="task-title">
          ${taskTitle}
          ${isPro ? '<span class="pro-badge">PRO</span>' : ""}
        </div>
        
        ${
          taskDescription
            ? `
          <div class="task-description">
            <p>${taskDescription}</p>
          </div>
        `
            : ""
        }
        
        <div class="date-info">
          ${
            dueDate
              ? `
            <div class="date-label">📅 Due Date:</div>
            <div class="date-value">${formatDate(dueDate)}</div>
          `
              : ""
          }
          
          ${
            reminderDate
              ? `
            <div class="date-label">⏰ Reminder Date:</div>
            <div class="date-value">${formatDate(reminderDate)}</div>
          `
              : ""
          }
        </div>
        
        <div style="margin-top: 25px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #667eea; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: 600;
                    display: inline-block;">
            View Task Dashboard
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>This reminder was sent because you have an upcoming task.</p>
        <p>${
          isPro
            ? "Custom reminder dates are a PRO feature."
            : "Upgrade to PRO for custom reminder dates."
        }</p>
      </div>
    </body>
    </html>
  `;
};
