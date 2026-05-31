import * as React from "react";
import { Minus } from "lucide-react";

const InputOTPSeparator = React.forwardRef((props, ref) => (
  <div ref={ref} aria-hidden="true" {...props}>
    <Minus />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTPSeparator };
