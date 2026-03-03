import { app } from "./app";
import { Logger } from "@finserv/logger";

const logger = new Logger("trading-service");
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`Trading Service listening on port ${PORT}`);
});
