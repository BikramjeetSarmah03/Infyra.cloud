import { createApp, mountDocs } from "@/core";
import { platformModule } from "@/modules/platform/platform.module";

const app = createApp();

app.route("/api/platform", platformModule());

app.get("/", (c) => c.text("OK"));

mountDocs(app);

export default app;
