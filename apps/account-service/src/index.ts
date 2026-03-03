import { app } from "./app";
import { Logger } from "@finserv/logger";

const logger = new Logger("account-service");
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Account Service listening on port ${PORT}`);
});
