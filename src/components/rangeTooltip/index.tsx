import React, { useEffect,useRef } from "react";
import Tooltip from "rc-tooltip";
import raf from "rc-util/lib/raf";
import "rc-tooltip/assets/bootstrap.css";
import type { TooltipRef } from "rc-tooltip";

interface HandleTooltipProps {
    value: number;
    children: React.ReactElement;
    visible: boolean;
    tipFormatter?: (value: number) => React.ReactNode;
  }
  
  const HandleTooltip: React.FC<HandleTooltipProps> = (props) => {
    const {
      value,
      children,
      visible,
      tipFormatter = (val) => `${val} %`,
      ...restProps
    } = props;
  
    const tooltipRef = useRef<TooltipRef>(null);
    const rafRef = useRef<number | null>(null);
  
    function cancelKeepAlign() {
      raf.cancel(rafRef.current!);
    }
  
    function keepAlign() {
      rafRef.current = raf(() => {
        tooltipRef.current?.forceAlign();
      });
    }

    useEffect(() => {
        if (visible) {
          keepAlign();
        } else {
          cancelKeepAlign();
        }
    
        return cancelKeepAlign;
      }, [value, visible]);
    
      return (
        <Tooltip
          placement="top"
          overlay={tipFormatter(value)}
          overlayInnerStyle={{ minHeight: "auto" }}
          ref={tooltipRef}
          visible={visible}
          {...restProps}
        >
          {children}
        </Tooltip>
      );
    };

    export default HandleTooltip;