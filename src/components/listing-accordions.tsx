"use client";

import { useState, ReactNode } from "react";
import { SmoothAccordion } from "./smooth-accordion";

type ListingAccordionsProps = {
  ownershipTitle: ReactNode;
  ownershipContent: ReactNode;
  ownershipPrice: ReactNode;
  comparisonTitle: ReactNode;
  comparisonRightContent: ReactNode;
  comparisonContent: ReactNode;
};

export function ListingAccordions({
  ownershipTitle,
  ownershipContent,
  ownershipPrice,
  comparisonTitle,
  comparisonRightContent,
  comparisonContent,
}: ListingAccordionsProps) {
  const [openAccordion, setOpenAccordion] = useState<"ownership" | "comparison" | null>(
    "ownership"
  );

  return (
    <>
      <SmoothAccordion
        id="ownership-details"
        title={ownershipTitle}
        rightContent={ownershipPrice}
        isOpen={openAccordion === "ownership"}
        onOpenChange={(open) => {
          setOpenAccordion(open ? "ownership" : null);
        }}
      >
        {ownershipContent}
      </SmoothAccordion>

      <SmoothAccordion
        id="comparison-details"
        title={comparisonTitle}
        rightContent={comparisonRightContent}
        isOpen={openAccordion === "comparison"}
        onOpenChange={(open) => {
          setOpenAccordion(open ? "comparison" : null);
        }}
      >
        {comparisonContent}
      </SmoothAccordion>
    </>
  );
}
