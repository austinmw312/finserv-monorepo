import { app } from "./app";
import { Logger } from "@finserv/logger";

const logger = new Logger("notification-service");
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  logger.info(`Notification Service listening on port ${PORT}`);
});
