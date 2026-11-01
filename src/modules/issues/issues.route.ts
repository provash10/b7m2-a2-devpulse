import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";

const router = Router();

// create new issue route
router.post(
  "/",
  auth("contributor", "maintainer"),
  issuesController.createIssue
);

// get all issues route
router.get("/", issuesController.getAllIssues);

// get single issue route
router.get("/:id", issuesController.getSingleIssue);

// update issue route
router.patch(
  "/:id",
  auth("contributor", "maintainer"),
  issuesController.updateIssue
);

// delete issue route
router.delete(
  "/:id",
  auth("maintainer"),
  issuesController.deleteIssue
);

export const issueRoute = router;
