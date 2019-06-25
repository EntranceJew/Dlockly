function disableUnapplicable(event) {
  if (event.type != Blockly.Events.MOVE && event.type != Blockly.Events.CREATE) return;

  var workspace = Blockly.Workspace.getById(event.workspaceId);
  var blocks = workspace.getAllBlocks(false);

  for (var block of blocks) {
    if (!block) continue;
    if (!document.restrictions[block.type]) continue;
    if (!validateConfiguration(block)) continue;

    if (validaterestrictions(block, blocks)) {
      block.setDisabled(false);
      block.setWarningText(null);
    } else if (!workspace.isDragging()) {
      block.setDisabled(true);
      block.setWarningText(decode(document.restrictions[block.type].message));
    }
  }
};

function validaterestrictions(block, blocks) {
  var reverse = false;
  var type = document.restrictions[block.type].type;
  if (type.startsWith("!")) {
    type = type.substring(1);
    reverse = true;
  }
  switch (type) {
    case "toplevelparent":
      return (document.restrictions[block.type].types.includes(getTopLevelParent(block).type)) != reverse;
    case "blockexists":
      return (blocks.filter(b => document.restrictions[block.type].types.includes(b.type) && !b.disabled).length > 0) != reverse;
    case "parent":
      return (document.restrictions[block.type].types.includes(block.getParent().type)) != reverse;
    default:
      return true;
  }
}

function validateConfiguration(block) {
  switch (document.restrictions[block.type].type) {
    case "toplevelparent":
    case "!toplevelparent":
      return getTopLevelParent(block) && !getTopLevelParent(block).disabled;
    case "blockexists":
    case "!blockexists":
      return true;
    case "parent":
    case "!parent":
      return block.getParent() && !block.getParent().disabled;
    default:
      return false;
  }
}

function getTopLevelParent(block) {
  if (!block) return undefined;
  if (!block.getParent()) return block;

  return getTopLevelParent(block.getParent());
}