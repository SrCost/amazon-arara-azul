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
    <div className="mb-4 sm:mb-6 lg:mb-8">
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                  currentStep >= s.number
                    ? "bg-gradient-forest text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > s.number ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : s.number}
              </div>
              <span className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-center hidden xs:block">{s.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 sm:h-1 flex-1 mx-1 sm:mx-0 ${
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
