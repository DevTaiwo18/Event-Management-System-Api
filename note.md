
            if (req.body.ticketPrice && req.body.ticketBankName && req.body.ticketBankAccount && req.body.ticketBankHolderName) {
                const { ticketPrice, ticketBankName, ticketBankAccount, ticketBankHolderName } = req.body;
                const ticket = await Ticket.create({
                    eventId: event._id,
                    userId: req.user._id,
                    price: ticketPrice,
                    bankName: ticketBankName,
                    bankAccount: ticketBankAccount,
                    bankHolderName: ticketBankHolderName
                });

                event.tickets = ticket._id;
                await event.save();
            }