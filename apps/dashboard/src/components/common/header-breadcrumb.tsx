import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useLocation } from "@tanstack/react-router";

export function HeaderBreadcrumb() {
  const { pathname } = useLocation();

  const segments = pathname.split("/").filter((segment) => segment.length > 0);

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");

  const createHref = (index: number) => {
    // biome-ignore lint/style/useTemplate: <its okay>
    return "/" + segments.slice(0, index + 1).join("/");
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="text-foreground">
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          return (
            <React.Fragment key={index.toString()}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-foreground">
                  <Link to={createHref(index)}>{capitalize(segment)}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
