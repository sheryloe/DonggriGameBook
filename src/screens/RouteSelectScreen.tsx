import EventScreen from "./EventScreen";

export default function RouteSelectScreen() {
  return (
    <section className="special-screen route-select">
      <div className="special-banner">
        <p className="eyebrow">Route Select</p>
        <h2>Choose the safer path before moving deeper into the chapter.</h2>
      </div>
      <EventScreen />
    </section>
  );
}
