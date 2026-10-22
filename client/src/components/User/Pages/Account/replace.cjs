const fs = require('fs');
const file = 'c:/Users/ASUS/Desktop/aj-jewellers - Copy/client/src/components/User/Pages/Account/AccountPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `{isCompleted && index < ORDER_STATUS_STEPS.length && (
                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">Completed</p>
              )}
              {step.key === 'Return' && returnRequest?.adminResponse && (
                 <div className="mt-2 ml-8 p-3 bg-red-50/50 border border-red-100 rounded-sm">
                   <p className="font-jost text-xs text-red-800"><span className="font-semibold block mb-1">Reason for Rejection:</span> {returnRequest.adminResponse}</p>
                 </div>
              )}`;

content = content.replace(/\{isCompleted && \(\r?\n\s*<p className="font-jost text-\[11px\] text-\[#7A6A5C\] mt-1 ml-8">Completed<\/p>\r?\n\s*\)\}/g, replacement);

fs.writeFileSync(file, content);
console.log("Replaced successfully!");
