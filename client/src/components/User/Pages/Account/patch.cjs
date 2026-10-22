const fs = require('fs');
const file = 'c:/Users/ASUS/Desktop/aj-jewellers - Copy/client/src/components/User/Pages/Account/AccountPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const isCompleted = index < currentIndex;',
  'const isCompleted = index < finalCurrentIndex;'
);
content = content.replace(
  'const isCurrent = index === currentIndex;',
  'const isCurrent = index === finalCurrentIndex;'
);
content = content.replace(
  'const isFuture = index > currentIndex;',
  'const isFuture = index > finalCurrentIndex;'
);
content = content.replace(
  '{index < ORDER_STATUS_STEPS.length - 1 && (',
  '{index < steps.length - 1 && ('
);
content = content.replace(
  "style={{ background: index < currentIndex ? step.color : '#EAE3D5' }}",
  "style={{ background: index < finalCurrentIndex ? step.color : '#EAE3D5' }}"
);
content = content.replace(
  '{isCompleted && (\\r\\n                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">Completed</p>\\r\\n              )}',
  `{isCompleted && index < ORDER_STATUS_STEPS.length && (
                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">Completed</p>
              )}
              {step.key === 'Return' && returnRequest?.adminResponse && (
                 <div className="mt-2 ml-8 p-3 bg-red-50/50 border border-red-100 rounded-sm">
                   <p className="font-jost text-xs text-red-800"><span className="font-semibold block mb-1">Reason for Rejection:</span> {returnRequest.adminResponse}</p>
                 </div>
              )}`
);
content = content.replace(
  '{isCompleted && (\\n                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">Completed</p>\\n              )}',
  `{isCompleted && index < ORDER_STATUS_STEPS.length && (
                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">Completed</p>
              )}
              {step.key === 'Return' && returnRequest?.adminResponse && (
                 <div className="mt-2 ml-8 p-3 bg-red-50/50 border border-red-100 rounded-sm">
                   <p className="font-jost text-xs text-red-800"><span className="font-semibold block mb-1">Reason for Rejection:</span> {returnRequest.adminResponse}</p>
                 </div>
              )}`
);

fs.writeFileSync(file, content);
console.log("Done patching");
