import EventScreen from "./EventScreen";

export default function SafehouseScreen() {
  return (
    <section className="special-screen safehouse">
      <div className="special-banner">
        <p className="eyebrow">Safehouse</p>
        <h2>Resolve rest, barter, and branch choices before the next push.</h2>
      </div>
      <EventScreen />
    </section>
  );
}
