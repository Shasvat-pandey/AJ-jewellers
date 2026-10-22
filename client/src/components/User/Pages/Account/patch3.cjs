const fs = require('fs');
const file = 'c:/Users/ASUS/Desktop/aj-jewellers - Copy/client/src/components/User/Pages/Account/AccountPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldTimeline = content.substring(
  content.indexOf('// Order Timeline Component'),
  content.indexOf('export default function AccountPage() {')
);

const newTimeline = `// Order Timeline Component
const formatTimestamp = (dateString?: string) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const OrderTimeline = ({ order }: { order: any }) => {
  const currentStatus = order.orderStatus;
  const returnRequest = order.returnRequest;
  const currentIndex = ORDER_STATUS_STEPS.findIndex(s => s.key === currentStatus);
  
  const steps: any[] = ORDER_STATUS_STEPS.map((s, i) => ({
    ...s,
    timestamp: i === 0 ? (order.placedAt || order.createdAt) :
               i === 1 ? order.processingAt :
               i === 2 ? order.shippedAt :
               i === 3 ? order.deliveredAt : undefined
  }));
  
  if (returnRequest && returnRequest.type !== 'None') {
    steps.push({
      key: 'ReturnInitiated',
      label: \`\${returnRequest.type} Initiated\`,
      icon: Package,
      color: '#F59E0B',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      timestamp: returnRequest.requestedAt
    });
    
    if (returnRequest.status !== 'Pending') {
      const isRejected = returnRequest.status === 'Rejected';
      const isCompleted = returnRequest.status === 'Completed';
      const isApproved = returnRequest.status === 'Approved';
      
      steps.push({
        key: 'Return',
        label: \`\${returnRequest.type} \${returnRequest.status}\`,
        icon: Package,
        color: isRejected ? '#EF4444' : (isCompleted ? '#22C55E' : (isApproved ? '#F97316' : '#F59E0B')),
        bgColor: isRejected ? 'bg-red-50' : (isCompleted ? 'bg-green-50' : (isApproved ? 'bg-orange-50' : 'bg-yellow-50')),
        borderColor: isRejected ? 'border-red-200' : (isCompleted ? 'border-green-200' : (isApproved ? 'border-orange-200' : 'border-yellow-200')),
        textColor: isRejected ? 'text-red-700' : (isCompleted ? 'text-green-700' : (isApproved ? 'text-orange-700' : 'text-yellow-700')),
        timestamp: order.updatedAt
      });
    }
  }

  const finalCurrentIndex = steps.length > ORDER_STATUS_STEPS.length ? steps.length - 1 : currentIndex;
  
  return (
    <div className="relative pl-4 border-l-2 border-[#EAE3D5]">
      {steps.map((step, index) => {
        const isCompleted = index < finalCurrentIndex;
        const isCurrent = index === finalCurrentIndex;
        const isFuture = index > finalCurrentIndex;
        
        const Icon = step.icon;
        const timeStr = formatTimestamp(step.timestamp);
        
        return (
          <div key={step.key} className="relative pb-6 last:pb-0">
            {/* Timeline dot and connector */}
            <div className="absolute left-[-10px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300"
              style={{ 
                background: isCompleted ? step.color : (isCurrent ? step.color : '#FDFBF4'), 
                borderColor: isCompleted ? step.color : (isCurrent ? step.color : '#C9A24B') 
              }}>
              {isCompleted && <CheckCircle size={8} className="text-white" />}
              {isCurrent && !isCompleted && <Circle size={6} className="text-white" />}
              {isFuture && <Circle size={6} className="text-[#C9A24B]/30" />}
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className="absolute left-[-2px] top-6 w-0.5 h-full" 
                style={{ background: index < finalCurrentIndex ? step.color : '#EAE3D5' }} 
              />
            )}
            
            {/* Step content */}
            <div className="ml-2 min-h-[50px]">
              <div className="flex items-center gap-2">
                <span className={\`px-2.5 py-1 text-[10px] tracking-wider uppercase font-semibold border rounded-sm \${isCompleted || isCurrent ? step.bgColor + ' ' + step.textColor + ' ' + step.borderColor : 'bg-gray-50 text-gray-500 border-gray-200'}\`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="font-jost text-[10px] text-[#C9A24B] font-medium">Current</span>
                )}
              </div>
              {timeStr ? (
                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">{timeStr}</p>
              ) : isCompleted ? (
                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">Completed</p>
              ) : null}
              {step.key === 'Return' && returnRequest?.adminResponse && (
                 <div className="mt-2 ml-8 p-3 bg-red-50/50 border border-red-100 rounded-sm">
                   <p className="font-jost text-xs text-red-800"><span className="font-semibold block mb-1">Reason for Rejection:</span> {returnRequest.adminResponse}</p>
                 </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

`;

content = content.replace(oldTimeline, newTimeline);
content = content.replace(
  '<OrderTimeline currentStatus={selectedOrder.orderStatus} returnRequest={selectedOrder.returnRequest} />',
  '<OrderTimeline order={selectedOrder} />'
);

fs.writeFileSync(file, content);
console.log('done!');
