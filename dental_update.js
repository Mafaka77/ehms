exports.updateDentalCharge = async (chargeId, updateData) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const DentalPatientCharge = require('./dental_patient_charge.model');
        const charge = await DentalPatientCharge.findById(chargeId).session(session);
        if (!charge) {
            const error = new Error('Charge record not found');
            error.status = 404;
            throw error;
        }

        if (charge.isBilled) {
            const error = new Error('Cannot update a charge that is already billed');
            error.status = 400;
            throw error;
        }

        if (updateData.rate !== undefined) charge.rate = Number(updateData.rate);
        if (updateData.quantity !== undefined) charge.quantity = Number(updateData.quantity);
        charge.amount = charge.rate * charge.quantity;

        await charge.save({ session });
        await session.commitTransaction();
        session.endSession();
        return charge;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}
