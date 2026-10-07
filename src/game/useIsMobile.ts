import { useEffect, useState } from "react";

const MQ = "(max-width: 899px), (pointer: coarse) and (max-width: 1100px)";

export function useIsMobile() {
  const [mobile, setMobile] = useState(() => matchMedia(MQ).matches);
  useEffect(() => {
    const q = matchMedia(MQ);
    const on = () => setMobile(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("mobile", mobile);
  }, [mobile]);
  return mobile;
}
