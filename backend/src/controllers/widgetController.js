import UserLayout from '../models/UserLayout.js';

export const getLayout = async (req, res, next) => {
  try {
    let layout = await UserLayout.findOne({ userId: req.user._id });
    if (!layout) {
      // Create and return default layout settings if not found
      layout = await UserLayout.create({ userId: req.user._id });
    }
    res.status(200).json({
      success: true,
      data: layout
    });
  } catch (err) {
    next(err);
  }
};

export const saveLayout = async (req, res, next) => {
  try {
    const { widgets } = req.body;

    if (!widgets || !Array.isArray(widgets)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid widgets layout list array.'
      });
    }

    let layout = await UserLayout.findOne({ userId: req.user._id });
    if (!layout) {
      layout = await UserLayout.create({ userId: req.user._id, widgets });
    } else {
      layout.widgets = widgets;
      await layout.save();
    }

    res.status(200).json({
      success: true,
      message: 'Dashboard custom workspace layout persisted successfully',
      data: layout
    });
  } catch (err) {
    next(err);
  }
};
