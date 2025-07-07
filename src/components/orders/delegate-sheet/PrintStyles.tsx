"use client";

import { PrintStylesProps } from "./types";

const PrintStyles = ({ css }: PrintStylesProps) => {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

export default PrintStyles;
