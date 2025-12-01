import { Check } from "lucide-react";

interface Step {
  number: number;
  title: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
}

export const StepProgress = ({ steps, currentStep }: StepProgressProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= s.number
                    ? "bg-gradient-forest text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > s.number ? <Check className="h-5 w-5" /> : s.number}
              </div>
              <span className="text-xs mt-2 text-center hidden sm:block">{s.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 ${
                  currentStep > s.number ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
