import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
    uid: {
        type: String,
        ref: 'user',
        required: true
    },

    cropId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'crop',
        required: true,
        unique : true
    },

    loanPurpose: {
        type: String,
        required: true
    },

    requestedAmount: {
        type: Number,
        required: true,
        min: 0
    },

    applicationDate: {
        type: Date,
        default: Date.now
    },

    loanTenure: {
        type: Number,
        required: true,
        min: 1
    },

    status: {
        type: String,
        enum: ['not-submitted', 'submitted', 'under-review'],
        default: 'not-submitted',
        required: true
    }

});

loanSchema.virtual('utilizationPercentage').get(function () {
    if (this.requestedAmount && this.approvedAmount) {
        return (this.approvedAmount / this.requestedAmount) * 100;
    }
    return 0;
});


const Loan = mongoose.model('Loan', loanSchema);
export default Loan;