import { CmsPage } from "../components/CmsPage";
import { EventList } from "../components/EventList";

export function EventsPage() {
  return (
    <CmsPage slug="events">
      <EventList />
    </CmsPage>
  );
}
