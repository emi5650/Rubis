import { NavGroup, RouteState } from "./types";

export function parseLegacyRouteFromHash(hash: string, navGroups: NavGroup[]): RouteState {
  const defaultGroup = navGroups[0];
  const defaultItem = defaultGroup.items[0];

  const cleaned = hash.replace(/^#\/?/, "");
  const [first, second] = cleaned.split("/");

  if (first === "dashboard") {
    return { view: "dashboard", groupId: defaultGroup.id, itemId: defaultItem.id };
  }

  if (first === "roadmap") {
    return { view: "roadmap", groupId: defaultGroup.id, itemId: defaultItem.id };
  }

  return {
    view: "workspace",
    groupId: first || defaultGroup.id,
    itemId: second || defaultItem.id
  };
}

export function buildLegacyHash(view: RouteState["view"], navGroups: NavGroup[], groupId?: string, itemId?: string): string {
  const defaultGroup = navGroups[0];
  const defaultItem = defaultGroup.items[0];

  if (view === "dashboard") {
    return "#/dashboard";
  }

  if (view === "roadmap") {
    return "#/roadmap";
  }

  const targetGroup = groupId || defaultGroup.id;
  const group = navGroups.find((entry) => entry.id === targetGroup) || defaultGroup;
  const targetItem = itemId || group.items[0]?.id || defaultItem.id;
  return `#/${group.id}/${targetItem}`;
}
